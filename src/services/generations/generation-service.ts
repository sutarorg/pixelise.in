import "server-only";

import { randomUUID } from "node:crypto";

import type { CreateGenerationResult, Generation, GenerationStatus, Paginated } from "@/lib/api/types";
import { serverEnv } from "@/config/env";
import { defaultQualities, defaultScenes, defaultStyles, FAL_WEBHOOK_PATH } from "@/config/generation";
import { buildPrompt } from "@/lib/ai/prompt-builder";
import {
  cancelQueueRequest,
  getQueueResult,
  getQueueStatus,
  submitToQueue,
  type FalStatus,
} from "@/lib/ai/fal-client";
import { failures } from "@/lib/http/errors";
import { createLogger } from "@/lib/logging";
import {
  createPresignedDownload,
  fetchProviderResult,
  putObject,
} from "@/lib/storage/r2";
import { extensionFor, sniffImage } from "@/lib/storage/image-metadata";
import { getServiceClient } from "@/lib/supabase/service";
import { releaseCredits, reserveCredits, resolveGenerationPrice, settleCredits } from "@/services/credits/credit-service";
import { getOwnedAsset, signedAssetUrl } from "@/services/uploads/upload-service";

/**
 * Generation pipeline.
 *
 *   price → route → record → reserve → submit → track → validate → copy to R2
 *        → asset row → settle → complete
 *
 * Every failure path ends with the hold released and a refund row, so a customer
 * cannot lose credits to a job that produced nothing. Every success path settles
 * once, guarded by the generation row itself.
 */

const log = createLogger("generation");

export const FAILURE_MESSAGES = {
  provider_error: "Your image could not be processed. Your reserved credits have been returned.",
  timeout: "This generation took too long and was stopped. Your reserved credits have been returned.",
  storage: "Your image was created but could not be saved. Your reserved credits have been returned.",
  cancelled: "This generation was cancelled. Your reserved credits have been returned.",
  unreadable_output: "The generated file could not be read. Your reserved credits have been returned.",
} as const;

type FailureCode = keyof typeof FAILURE_MESSAGES;

/* ---------------------------------- Rows ---------------------------------- */

interface GenerationRow {
  id: string;
  user_id: string;
  source_asset_id: string;
  photography_style: string;
  scene_id: string | null;
  quality_id: string;
  aspect_ratio: string;
  resolution: string | null;
  model_id: string | null;
  model_endpoint: string;
  generation_status: "queued" | "processing" | "completed" | "failed" | "cancelled";
  credit_cost: number;
  credits_reserved: number;
  provider_request_id: string | null;
  provider_status_url: string | null;
  provider_response_url: string | null;
  failure_code: string | null;
  failure_message_safe: string | null;
  created_at: string;
  completed_at: string | null;
}

interface ModelRow {
  id: string;
  endpoint: string;
  name: string;
  output_resolutions: string[] | null;
  availability: string;
}

/* -------------------------------- Mapping --------------------------------- */

const statusToClient: Record<GenerationRow["generation_status"], GenerationStatus> = {
  queued: "preparing",
  processing: "rendering",
  completed: "completed",
  failed: "failed",
  cancelled: "cancelled",
};

function styleName(id: string): string {
  return defaultStyles.find((style) => style.id === id)?.name ?? id;
}

function qualityLabel(id: string): string {
  return defaultQualities.find((quality) => quality.id === id)?.label ?? id;
}

async function present(row: GenerationRow, extras?: { resultKey?: string | null; sourceKey?: string | null }): Promise<Generation> {
  const supabase = getServiceClient();

  let resultKey = extras?.resultKey ?? null;
  let sourceKey = extras?.sourceKey ?? null;
  let width: number | null = null;
  let height: number | null = null;

  if (resultKey === null) {
    const { data: output } = await supabase
      .from("generation_outputs")
      .select("asset_id, assets:asset_id (object_key, width, height)")
      .eq("generation_id", row.id)
      .limit(1)
      .maybeSingle();

    const asset = (output as { assets?: { object_key?: string; width?: number; height?: number } } | null)?.assets;
    resultKey = asset?.object_key ?? null;
    width = asset?.width ?? null;
    height = asset?.height ?? null;
  } else {
    const { data: asset } = await supabase
      .from("assets")
      .select("width, height")
      .eq("object_key", resultKey)
      .maybeSingle();
    width = (asset?.width as number | null) ?? null;
    height = (asset?.height as number | null) ?? null;
  }

  if (sourceKey === null) {
    const { data: source } = await supabase
      .from("assets")
      .select("object_key")
      .eq("id", row.source_asset_id)
      .maybeSingle();
    sourceKey = (source?.object_key as string | null) ?? null;
  }

  const resultUrl = await signedAssetUrl(resultKey);

  return {
    id: row.id,
    status: statusToClient[row.generation_status],
    styleId: row.photography_style,
    styleName: styleName(row.photography_style),
    sceneId: row.scene_id,
    sceneName: row.scene_id ? defaultScenes.find((scene) => scene.id === row.scene_id)?.name ?? row.scene_id : null,
    aspectRatio: row.aspect_ratio,
    qualityId: row.quality_id,
    qualityLabel: qualityLabel(row.quality_id),
    width,
    height,
    creditsCharged:
      row.generation_status === "completed"
        ? row.credit_cost
        : row.generation_status === "failed" || row.generation_status === "cancelled"
          ? 0
          : null,
    creditsReserved: row.generation_status === "queued" || row.generation_status === "processing" ? row.credits_reserved : null,
    createdAt: row.created_at,
    completedAt: row.completed_at,
    failureReason: row.failure_message_safe,
    sourceUrl: await signedAssetUrl(sourceKey),
    resultUrl,
    thumbnailUrl: resultUrl,
  };
}

/* --------------------------------- Routing -------------------------------- */

async function pickModel(qualityId: string, resolution: string | null): Promise<{ model: ModelRow; resolution: string | null }> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("model_configs")
    .select("id, endpoint, name, output_resolutions, availability")
    .eq("routing_enabled", true)
    .in("availability", ["available", "degraded"])
    .order("provider_cost_usd", { ascending: true, nullsFirst: false })
    .limit(1);

  if (error) throw failures.unavailable("We couldn't pick an image model.");
  const model = (data?.[0] as ModelRow | undefined) ?? null;
  if (!model) {
    throw failures.notConfigured(
      "Image generation isn't switched on yet. Once it is, your credits will work here.",
    );
  }

  void qualityId;
  const supported = model.output_resolutions ?? [];
  const chosen = resolution && supported.includes(resolution) ? resolution : supported[0] ?? null;
  return { model, resolution: chosen };
}

/* --------------------------------- Create --------------------------------- */

export async function createGeneration(input: {
  userId: string;
  sourceAssetId: string;
  styleId: string;
  sceneId: string | null;
  qualityId: string;
  aspectRatio: string;
  idempotencyKey: string | null;
}): Promise<CreateGenerationResult> {
  const supabase = getServiceClient();

  /* 1. The asset must belong to this customer. */
  const asset = await getOwnedAsset({ userId: input.userId, assetId: input.sourceAssetId });
  if (!asset) throw failures.notFound("Upload that image again — we can't find it on your account.");

  /* 2. Price comes from configuration, never from the request. */
  const price = await resolveGenerationPrice({ styleId: input.styleId, qualityId: input.qualityId });
  if (!price || !price.approved) {
    throw failures.notConfigured(
      "Generation pricing hasn't been approved yet, so nothing is charged and nothing runs.",
    );
  }

  /* 3. Idempotency: the same key returns the generation it already created. */
  if (input.idempotencyKey) {
    const { data: existing } = await supabase
      .from("generations")
      .select("*")
      .eq("idempotency_key", input.idempotencyKey)
      .eq("user_id", input.userId)
      .maybeSingle();

    if (existing) {
      return { generation: await present(existing as GenerationRow), estimatedCredits: price.credits };
    }
  }

  /* 4. Route to a model the owner has switched on. */
  const { model, resolution } = await pickModel(input.qualityId, price.resolution);

  /* 5. Record the job before any money moves. */
  const generationId = randomUUID();
  const { data: created, error: insertError } = await supabase
    .from("generations")
    .insert({
      id: generationId,
      user_id: input.userId,
      source_asset_id: input.sourceAssetId,
      photography_style: input.styleId,
      scene_id: input.sceneId,
      quality_id: input.qualityId,
      aspect_ratio: input.aspectRatio,
      resolution,
      model_id: model.id,
      model_endpoint: model.endpoint,
      generation_status: "queued",
      credit_cost: price.credits,
      credits_reserved: 0,
      idempotency_key: input.idempotencyKey ?? `generation:${generationId}`,
    })
    .select("*")
    .single();

  if (insertError || !created) {
    log.error("generation insert failed", { userId: input.userId, code: insertError?.code });
    throw failures.unavailable("We couldn't start that generation.");
  }

  /* 6. Hold the credits. If this throws, nothing was submitted. */
  try {
    await reserveCredits({
      userId: input.userId,
      generationId,
      credits: price.credits,
    });
  } catch (error) {
    await supabase
      .from("generations")
      .update({
        generation_status: "failed",
        failure_code: "insufficient_credits_at_start",
        failure_message_safe: "You don't have enough credits for this generation.",
        completed_at: new Date().toISOString(),
      })
      .eq("id", generationId);
    throw error;
  }

  /* 7. Submit. A signed source URL lets the provider fetch the private original. */
  try {
    const sourceUrl = await createPresignedDownload(asset.objectKey, 3600);
    const { prompt } = buildPrompt({
      styleId: input.styleId,
      sceneId: input.sceneId,
      aspectRatio: input.aspectRatio,
    });

    const payload: Record<string, unknown> = {
      prompt,
      image_urls: [sourceUrl],
      aspect_ratio: input.aspectRatio,
    };
    if (resolution) payload.resolution = resolution;

    const submission = await submitToQueue({
      endpoint: model.endpoint,
      payload,
      webhookUrl: `${serverEnv.appUrl}${FAL_WEBHOOK_PATH}`,
    });

    const { data: updated } = await supabase
      .from("generations")
      .update({
        provider_request_id: submission.requestId,
        provider_status_url: submission.statusUrl,
        provider_response_url: submission.responseUrl,
        generation_status: "processing",
        started_at: new Date().toISOString(),
      })
      .eq("id", generationId)
      .select("*")
      .single();

    return {
      generation: await present((updated ?? created) as GenerationRow),
      estimatedCredits: price.credits,
    };
  } catch (error) {
    log.error("submit failed", {
      userId: input.userId,
      generationId,
      error: error instanceof Error ? error.message : String(error),
    });
    await failGeneration(generationId, "provider_error");
    throw error instanceof Error && "code" in error
      ? error
      : failures.unavailable(FAILURE_MESSAGES.provider_error);
  }
}

/* -------------------------------- Progression ----------------------------- */

async function loadGeneration(generationId: string): Promise<GenerationRow> {
  const supabase = getServiceClient();
  const { data, error } = await supabase.from("generations").select("*").eq("id", generationId).maybeSingle();
  if (error) throw failures.unavailable("We couldn't read that generation.");
  if (!data) throw failures.notFound("That generation doesn't exist.");
  return data as GenerationRow;
}

/** Marks a job failed and returns its credits, exactly once. */
export async function failGeneration(generationId: string, code: FailureCode | string): Promise<void> {
  const supabase = getServiceClient();
  const message = FAILURE_MESSAGES[code as FailureCode] ?? FAILURE_MESSAGES.provider_error;

  const { data: updated } = await supabase
    .from("generations")
    .update({
      generation_status: "failed",
      failure_code: code,
      failure_message_safe: message,
      completed_at: new Date().toISOString(),
    })
    .eq("id", generationId)
    .in("generation_status", ["queued", "processing"])
    .select("id")
    .maybeSingle();

  if (!updated) return; // already terminal — a duplicate callback, not an error

  await releaseCredits(generationId);
  log.info("generation failed and refunded", { generationId, code });
}

/**
 * Moves a job forward by asking the provider. Safe to call as often as you like:
 * terminal states are no-ops, and the copy-into-R2 step is guarded by the asset
 * uniqueness constraint per generation.
 */
export async function refreshGeneration(generationId: string): Promise<Generation> {
  const row = await loadGeneration(generationId);

  if (row.generation_status === "completed" || row.generation_status === "failed" || row.generation_status === "cancelled") {
    return present(row);
  }

  if (!row.provider_status_url || !row.provider_response_url) {
    await failGeneration(generationId, "provider_error");
    return present(await loadGeneration(generationId));
  }

  let status: FalStatus;
  try {
    status = await getQueueStatus(row.provider_status_url);
  } catch (error) {
    log.warn("status read failed", {
      generationId,
      error: error instanceof Error ? error.message : String(error),
    });
    return present(row);
  }

  if (status.status === "IN_QUEUE" || status.status === "IN_PROGRESS") {
    return present(row);
  }

  if (status.status === "ERROR" || status.status === "CANCELLED") {
    await failGeneration(generationId, status.status === "CANCELLED" ? "cancelled" : "provider_error");
    return present(await loadGeneration(generationId));
  }

  // COMPLETED: read the result, copy the bytes into our bucket, then settle.
  try {
    const result = await getQueueResult(row.provider_response_url);
    const image = result.images[0];
    if (!image) throw new Error("empty_result");

    const downloaded = await fetchProviderResult(image.url);
    const sniffed = sniffImage(downloaded.bytes);
    if (!sniffed) {
      await failGeneration(generationId, "unreadable_output");
      return present(await loadGeneration(generationId));
    }

    const supabase = getServiceClient();
    const outputAssetId = randomUUID();
    const key = `generated/${row.user_id}/${generationId}/${outputAssetId}.${extensionFor(sniffed.mimeType)}`;

    await putObject({
      key,
      body: downloaded.bytes,
      contentType: sniffed.mimeType,
    });

    const { error: assetError } = await supabase.from("assets").insert({
      id: outputAssetId,
      user_id: row.user_id,
      asset_type: "generated",
      object_key: key,
      mime_type: sniffed.mimeType,
      file_size: downloaded.bytes.byteLength,
      width: sniffed.width,
      height: sniffed.height,
      generation_id: generationId,
    });

    if (assetError) {
      // A duplicate delivery loses the race here; the existing output stands.
      if (assetError.code !== "23505") {
        log.error("output asset insert failed", { generationId, code: assetError.code });
        await failGeneration(generationId, "storage");
        return present(await loadGeneration(generationId));
      }
    } else {
      await supabase.from("generation_outputs").insert({
        generation_id: generationId,
        asset_id: outputAssetId,
      });
    }

    const { data: settled } = await supabase
      .from("generations")
      .update({
        generation_status: "completed",
        completed_at: new Date().toISOString(),
        failure_code: null,
        failure_message_safe: null,
      })
      .eq("id", generationId)
      .in("generation_status", ["queued", "processing"])
      .select("*")
      .maybeSingle();

    if (settled) {
      const charged = await settleCredits(generationId);
      log.info("generation completed", { generationId, charged });
      return present(settled as GenerationRow, { resultKey: key });
    }

    return present(await loadGeneration(generationId));
  } catch (error) {
    log.error("completion failed", {
      generationId,
      error: error instanceof Error ? error.message : String(error),
    });
    await failGeneration(generationId, "storage");
    return present(await loadGeneration(generationId));
  }
}

/* --------------------------------- Queries -------------------------------- */

export async function listGenerations(input: {
  userId: string;
  style?: string | null;
  sort?: "newest" | "oldest";
  cursor?: string | null;
  limit?: number;
}): Promise<Paginated<Generation>> {
  const limit = Math.min(Math.max(input.limit ?? 12, 1), 50);
  const supabase = getServiceClient();

  let query = supabase
    .from("generations")
    .select("*")
    .eq("user_id", input.userId)
    .order("created_at", { ascending: input.sort === "oldest" })
    .limit(limit + 1);

  if (input.style) query = query.eq("photography_style", input.style);
  if (input.cursor) {
    query = input.sort === "oldest"
      ? query.gt("created_at", input.cursor)
      : query.lt("created_at", input.cursor);
  }

  const { data, error } = await query;
  if (error) throw failures.unavailable("We couldn't load your creations.");

  const rows = (data ?? []) as GenerationRow[];
  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;

  return {
    items: await Promise.all(page.map((row) => present(row))),
    nextCursor: hasMore ? page[page.length - 1]?.created_at ?? null : null,
    total: null,
  };
}

export async function getGeneration(input: { userId: string; generationId: string }): Promise<Generation> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("generations")
    .select("*")
    .eq("id", input.generationId)
    .eq("user_id", input.userId)
    .maybeSingle();

  if (!data) throw failures.notFound("We couldn't find that generation.");
  const row = data as GenerationRow;

  // A page view is a good moment to advance a job that is still running.
  if (row.generation_status === "queued" || row.generation_status === "processing") {
    return refreshGeneration(row.id);
  }

  return present(row);
}

/** Cancel is best-effort: the provider may already have finished. */
export async function cancelGeneration(input: { userId: string; generationId: string }): Promise<Generation> {
  const row = await loadGeneration(input.generationId);
  if (row.user_id !== input.userId) throw failures.notFound("We couldn't find that generation.");

  if (row.generation_status !== "queued" && row.generation_status !== "processing") {
    throw failures.conflict("This generation has already finished, so it can't be cancelled.");
  }

  const cancelUrl = row.provider_status_url
    ? row.provider_status_url.replace(/\/status$/, "/cancel")
    : null;

  if (cancelUrl) await cancelQueueRequest(cancelUrl);
  await failGeneration(row.id, "cancelled");
  return present(await loadGeneration(row.id));
}

/** Soft-delete a creation: the rows stay for audit, the object is unlinked. */
export async function deleteGeneration(input: { userId: string; generationId: string }): Promise<void> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("generations")
    .select("id, user_id")
    .eq("id", input.generationId)
    .maybeSingle();

  if (!data || data.user_id !== input.userId) throw failures.notFound("We couldn't find that generation.");

  await supabase
    .from("assets")
    .update({ deleted_at: new Date().toISOString() })
    .eq("generation_id", input.generationId);

  await supabase
    .from("generations")
    .update({ generation_status: "cancelled", failure_message_safe: "Removed from your creations." })
    .eq("id", input.generationId);
}
