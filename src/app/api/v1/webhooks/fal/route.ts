import { NextResponse, type NextRequest } from "next/server";

import { createLogger } from "@/lib/logging";
import { getRequestId } from "@/lib/http/request";
import { getServiceClient } from "@/lib/supabase/service";
import { refreshGeneration } from "@/services/generations/generation-service";

/**
 * POST /api/v1/webhooks/fal
 *
 * fal documents retries but no request signature, so this endpoint treats the
 * delivery as a *hint*: the only thing taken from the body is the request id.
 * Everything that decides money or assets is re-read from the queue API inside
 * `refreshGeneration`, which is idempotent.
 *
 * It always answers 200 once the notification has been recorded, because a
 * retried webhook adds nothing: reconciliation covers anything this missed.
 */

const log = createLogger("fal-webhook");

export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = getRequestId(request);

  let body: { request_id?: string; status?: string };
  try {
    body = (await request.json()) as { request_id?: string; status?: string };
  } catch {
    return NextResponse.json({ status: "ignored", reason: "unparseable", requestId }, { status: 200 });
  }

  const providerRequestId = body.request_id;
  if (!providerRequestId) {
    return NextResponse.json({ status: "ignored", reason: "missing_request_id", requestId }, { status: 200 });
  }

  let supabase: ReturnType<typeof getServiceClient>;
  try {
    supabase = getServiceClient();
  } catch (error) {
    // Not configured yet: answer honestly so the provider retries later instead
    // of counting a silent success.
    log.warn("fal webhook received before the backend was configured", {
      requestId,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ status: "unavailable", requestId }, { status: 503 });
  }

  const { data: generation } = await supabase
    .from("generations")
    .select("id, generation_status")
    .eq("provider_request_id", providerRequestId)
    .maybeSingle();

  if (!generation) {
    log.warn("webhook for unknown request", { requestId, providerRequestId });
    return NextResponse.json({ status: "ignored", reason: "unknown_request", requestId }, { status: 200 });
  }

  await supabase.from("webhook_events").insert({
    provider: "fal",
    event_id: providerRequestId,
    event_type: body.status === "ERROR" ? "job.error" : "job.completed",
    payload: body as never,
    processing_status: "received",
  }).then(({ error }) => {
    // Duplicate deliveries are expected; the generation row is the real guard.
    if (error && error.code !== "23505") log.warn("event record failed", { code: error.code });
  });

  try {
    await refreshGeneration(generation.id as string);
    await supabase
      .from("webhook_events")
      .update({ processing_status: "processed", processed_at: new Date().toISOString() })
      .eq("provider", "fal")
      .eq("event_id", providerRequestId);
  } catch (error) {
    log.error("refresh failed", {
      requestId,
      generationId: generation.id,
      error: error instanceof Error ? error.message : String(error),
    });
    await supabase
      .from("webhook_events")
      .update({
        processing_status: "failed",
        processed_at: new Date().toISOString(),
        safe_error: error instanceof Error ? error.message.slice(0, 200) : "unknown",
      })
      .eq("provider", "fal")
      .eq("event_id", providerRequestId);

    // Still 200: the job is not lost, reconciliation will pick it up, and a
    // retry storm would only repeat the same provider read.
    return NextResponse.json({ status: "deferred", requestId }, { status: 200 });
  }

  return NextResponse.json({ status: "ok", requestId }, { status: 200 });
}
