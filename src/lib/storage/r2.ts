import "server-only";

import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { serverEnv } from "@/config/env";
import { failures } from "@/lib/http/errors";

/**
 * Cloudflare R2 adapter.
 
 * The bucket is private. Nothing is ever served from R2 directly to a browser:
 * uploads use a short-lived signed PUT, downloads use a short-lived signed GET,
 * and the provider output is copied into the bucket by the server.
 *
 * This module knows only about objects. It has no idea what an asset or a
 * generation is — that belongs in `src/services/**`.
 */

let client: S3Client | null = null;

function endpoint(): string {
  if (serverEnv.r2.endpoint) return serverEnv.r2.endpoint;
  if (serverEnv.r2.accountId) {
    return `https://${serverEnv.r2.accountId}.r2.cloudflarestorage.com`;
  }
  throw failures.notConfigured("Image storage isn't connected yet. Set R2_ACCOUNT_ID and the R2 keys.");
}

function bucket(): string {
  if (!serverEnv.r2.bucket) {
    throw failures.notConfigured("Image storage isn't connected yet. Set R2_BUCKET_NAME.");
  }
  return serverEnv.r2.bucket;
}

function getClient(): S3Client {
  if (!serverEnv.r2.accessKeyId || !serverEnv.r2.secretAccessKey) {
    throw failures.notConfigured("Image storage isn't connected yet. Set the R2 access keys.");
  }

  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: endpoint(),
      credentials: {
        accessKeyId: serverEnv.r2.accessKeyId,
        secretAccessKey: serverEnv.r2.secretAccessKey,
      },
      // R2 is path-style only.
      forcePathStyle: true,
    });
  }

  return client;
}

export interface PresignedUpload {
  url: string;
  headers: Record<string, string>;
  expiresAt: string;
}

/**
 * A signed PUT for one exact key and content type. `ContentType` is part of the
 * signature, so a browser cannot upload a different type than the one the server
 * validated.
 */
export async function createPresignedUpload(input: {
  key: string;
  contentType: string;
  expiresInSeconds?: number;
}): Promise<PresignedUpload> {
  const expiresIn = input.expiresInSeconds ?? 120;

  const url = await getSignedUrl(
    getClient(),
    new PutObjectCommand({
      Bucket: bucket(),
      Key: input.key,
      ContentType: input.contentType,
    }),
    // Only Content-Type is bound into the signature. A signed Content-Length that
    // disagrees with the browser's body surfaces as an opaque 403, and the size is
    // checked against the stored object after the upload anyway.
    { expiresIn, signableHeaders: new Set(["content-type"]) },
  );

  return {
    url,
    headers: { "Content-Type": input.contentType },
    expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
  };
}

/** Short-lived GET for a private object. Five minutes is enough to render. */
export async function createPresignedDownload(
  key: string,
  expiresInSeconds = 300,
): Promise<string> {
  return getSignedUrl(
    getClient(),
    new GetObjectCommand({ Bucket: bucket(), Key: key }),
    { expiresIn: expiresInSeconds },
  );
}

export interface ObjectHead {
  contentLength: number;
  contentType: string | null;
  etag: string | null;
}

export async function headObject(key: string): Promise<ObjectHead | null> {
  try {
    const result = await getClient().send(
      new HeadObjectCommand({ Bucket: bucket(), Key: key }),
    );
    return {
      contentLength: Number(result.ContentLength ?? 0),
      contentType: result.ContentType ?? null,
      etag: result.ETag ?? null,
    };
  } catch {
    return null;
  }
}

/** First N bytes of an object, for magic-byte validation without a full download. */
export async function readObjectPrefix(key: string, bytes = 65_536): Promise<Uint8Array | null> {
  try {
    const result = await getClient().send(
      new GetObjectCommand({ Bucket: bucket(), Key: key, Range: `bytes=0-${bytes - 1}` }),
    );
    const body = result.Body as { transformToByteArray?: () => Promise<Uint8Array> } | undefined;
    if (!body?.transformToByteArray) return null;
    return await body.transformToByteArray();
  } catch {
    return null;
  }
}

export async function putObject(input: {
  key: string;
  body: Uint8Array;
  contentType: string;
}): Promise<void> {
  await getClient().send(
    new PutObjectCommand({
      Bucket: bucket(),
      Key: input.key,
      Body: input.body,
      ContentType: input.contentType,
      ContentLength: input.body.byteLength,
    }),
  );
}

/** Server-side copy: used to move a generated image out of a temporary key. */
export async function copyObject(fromKey: string, toKey: string): Promise<void> {
  await getClient().send(
    new CopyObjectCommand({
      Bucket: bucket(),
      CopySource: `${bucket()}/${fromKey}`,
      Key: toKey,
    }),
  );
}

export async function deleteObject(key: string): Promise<void> {
  await getClient().send(new DeleteObjectCommand({ Bucket: bucket(), Key: key }));
}

/**
 * Fetches a provider result so the bytes can be copied into our bucket.
 * Only `https` URLs whose host is on the allow-list are fetched; this is the only
 * place the server pulls a remote file, and it is never given a customer URL.
 */
const ALLOWED_RESULT_HOSTS = ["fal.media", "v3.fal.media", "storage.googleapis.com", "fal.run"];

export async function fetchProviderResult(url: string, maxBytes = 25 * 1024 * 1024): Promise<{
  bytes: Uint8Array;
  contentType: string;
}> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw failures.unavailable("The image provider returned an unusable file reference.");
  }

  const hostAllowed = ALLOWED_RESULT_HOSTS.some(
    (allowed) => parsed.hostname === allowed || parsed.hostname.endsWith(`.${allowed}`),
  );
  if (parsed.protocol !== "https:" || !hostAllowed) {
    throw failures.unavailable("The image provider returned an unusable file reference.");
  }

  const response = await fetch(parsed, { redirect: "error", cache: "no-store" });
  if (!response.ok) {
    throw failures.unavailable("The rendered image could not be downloaded.");
  }

  const length = Number(response.headers.get("content-length") ?? "0");
  if (length > maxBytes) {
    throw failures.unavailable("The rendered image was larger than expected.");
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength > maxBytes) {
    throw failures.unavailable("The rendered image was larger than expected.");
  }

  return { bytes, contentType: response.headers.get("content-type") ?? "image/png" };
}
