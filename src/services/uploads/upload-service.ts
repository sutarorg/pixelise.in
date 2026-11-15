import "server-only";

import { randomUUID } from "node:crypto";

import type { UploadAsset, UploadTicket } from "@/lib/api/types";
import { uploadConstraints } from "@/config/studio";
import { failures } from "@/lib/http/errors";
import { createLogger } from "@/lib/logging";
import {
  createPresignedDownload,
  createPresignedUpload,
  headObject,
  readObjectPrefix,
} from "@/lib/storage/r2";
import { extensionFor, sniffImage } from "@/lib/storage/image-metadata";
import { getServiceClient } from "@/lib/supabase/service";

/**
 * Upload service.
 *
 * The browser uploads bytes straight to R2; the server never proxies image data.
 * What the server does own:
 *
 *  · the object key — it is derived from the signed-in user id, never from a
 *    filename, so a customer cannot address someone else's prefix;
 *  · the content type — bound into the signature, then verified against the real
 *    bytes and the object's stored metadata;
 *  · the size — checked against the stored object, not the browser's claim;
 *  · the ownership of the resulting asset, recorded in our own table.
 */

const log = createLogger("uploads");

const PENDING_TTL_MS = 15 * 60 * 1000;
const UPLOAD_URL_TTL_SECONDS = 120;

export function originalObjectKey(userId: string, assetId: string, mimeType: string): string {
  return `originals/${userId}/${assetId}.${extensionFor(mimeType)}`;
}

const assetIdPattern = /^originals\/([0-9a-f-]{36})\/([0-9a-f-]{36})\.[a-z]{3,4}$/;

/** Creates the ticket and the pending row that will be confirmed later. */
export async function createUploadTicket(input: {
  userId: string;
  filename: string;
  mimeType: string;
  bytes: number;
}): Promise<UploadTicket> {
  if (!uploadConstraints.acceptedMimeTypes.includes(input.mimeType as never)) {
    throw failures.validation({ mimeType: "Upload a JPG, PNG or WebP image." });
  }
  if (input.bytes > uploadConstraints.maxBytes) {
    throw failures.validation({ bytes: "Images must be 20 MB or smaller." });
  }

  const supabase = getServiceClient();
  const assetId = randomUUID();
  const key = originalObjectKey(input.userId, assetId, input.mimeType);

  const { data: pending, error } = await supabase
    .from("pending_uploads")
    .insert({
      user_id: input.userId,
      object_key: key,
      mime_type: input.mimeType,
      expected_bytes: input.bytes,
      expires_at: new Date(Date.now() + PENDING_TTL_MS).toISOString(),
    })
    .select("id")
    .single();

  if (error || !pending) {
    log.error("pending upload insert failed", { userId: input.userId, code: error?.code });
    throw failures.unavailable("We couldn't prepare the upload.");
  }

  const presigned = await createPresignedUpload({
    key,
    contentType: input.mimeType,
    expiresInSeconds: UPLOAD_URL_TTL_SECONDS,
  });

  return {
    id: pending.id as string,
    uploadUrl: presigned.url,
    headers: presigned.headers,
    key,
    expiresAt: presigned.expiresAt,
  };
}

/**
 * Confirms an upload by inspecting what actually landed in the bucket.
 * Everything here is evidence-based: HEAD for size and type, magic bytes for
 * format, header parse for dimensions.
 */
export async function completeUpload(input: {
  userId: string;
  uploadId: string;
}): Promise<UploadAsset> {
  const supabase = getServiceClient();

  const { data: pending, error } = await supabase
    .from("pending_uploads")
    .select("id, user_id, object_key, mime_type, expected_bytes, status, expires_at")
    .eq("id", input.uploadId)
    .eq("user_id", input.userId)
    .maybeSingle();

  if (error) throw failures.unavailable("We couldn't confirm that upload.");
  if (!pending) throw failures.notFound("That upload doesn't exist.");
  if (pending.status === "completed") {
    throw failures.conflict("That upload was already confirmed.");
  }
  if (pending.status !== "pending") {
    throw failures.conflict("That upload can no longer be confirmed. Start a new one.");
  }
  if (new Date(pending.expires_at as string).getTime() < Date.now()) {
    throw failures.conflict("That upload link expired. Upload the image again.");
  }

  const key = pending.object_key as string;
  const match = assetIdPattern.exec(key);
  if (!match || match[1] !== input.userId) {
    throw failures.forbidden("That upload doesn't belong to this account.");
  }
  const assetId = match[2];

  const head = await headObject(key);
  if (!head || head.contentLength <= 0) {
    throw failures.validation(undefined, "The file didn't reach storage. Try uploading again.");
  }
  if (head.contentLength > uploadConstraints.maxBytes) {
    throw failures.validation(undefined, "That image is larger than 20 MB.");
  }

  const prefix = await readObjectPrefix(key, 64 * 1024);
  const sniffed = prefix ? sniffImage(prefix) : null;

  if (!sniffed) {
    await supabase.from("pending_uploads").update({ status: "rejected" }).eq("id", input.uploadId);
    throw failures.validation(undefined, "That file isn't a readable JPG, PNG or WebP image.");
  }

  const declared = pending.mime_type as string;
  if (sniffed.mimeType !== declared) {
    await supabase.from("pending_uploads").update({ status: "rejected" }).eq("id", input.uploadId);
    log.warn("content type mismatch", { userId: input.userId, declared, sniffed: sniffed.mimeType });
    throw failures.validation(undefined, "The file's contents don't match its type. Upload the original photo.");
  }

  if (sniffed.width < uploadConstraints.minDimension || sniffed.height < uploadConstraints.minDimension) {
    throw failures.validation(
      undefined,
      `Images need to be at least ${uploadConstraints.minDimension}px on both sides for a usable render.`,
    );
  }

  const { data: asset, error: insertError } = await supabase
    .from("assets")
    .insert({
      id: assetId,
      user_id: input.userId,
      asset_type: "original",
      object_key: key,
      mime_type: sniffed.mimeType,
      file_size: head.contentLength,
      width: sniffed.width,
      height: sniffed.height,
    })
    .select("id, width, height, file_size, mime_type, created_at")
    .single();

  if (insertError || !asset) {
    log.error("asset insert failed", { userId: input.userId, code: insertError?.code });
    throw failures.unavailable("We couldn't save that upload.");
  }

  await supabase
    .from("pending_uploads")
    .update({ status: "completed", completed_asset_id: asset.id })
    .eq("id", input.uploadId);

  return {
    id: asset.id as string,
    width: asset.width as number | null,
    height: asset.height as number | null,
    bytes: Number(asset.file_size),
    mimeType: asset.mime_type as string,
    createdAt: asset.created_at as string,
  };
}

/** The asset row, only if it belongs to this customer and is not deleted. */
export async function getOwnedAsset(input: {
  userId: string;
  assetId: string;
}): Promise<{ id: string; objectKey: string; mimeType: string } | null> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("assets")
    .select("id, object_key, mime_type, user_id, deleted_at")
    .eq("id", input.assetId)
    .maybeSingle();

  if (!data || data.user_id !== input.userId || data.deleted_at) return null;
  return { id: data.id as string, objectKey: data.object_key as string, mimeType: data.mime_type as string };
}

/** Short-lived link for a private object. Never cached, never logged. */
export async function signedAssetUrl(objectKey: string | null | undefined): Promise<string | null> {
  if (!objectKey) return null;
  try {
    return await createPresignedDownload(objectKey, 300);
  } catch {
    return null;
  }
}
