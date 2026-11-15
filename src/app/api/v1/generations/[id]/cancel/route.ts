import { requireUser } from "@/lib/auth/session";
import { apiRoute } from "@/lib/http/route";
import { ok } from "@/lib/http/response";
import { cancelGeneration } from "@/services/generations/generation-service";

/**
 * POST /api/v1/generations/{id}/cancel
 *
 * Cancellation is offered only while a job is queued or running; if the provider
 * has already finished, the job completes normally and the customer keeps the
 * image they were charged for.
 */

export const POST = apiRoute<{ id: string }>("generation-cancel", async ({ requestId, params }) => {
  const user = await requireUser();
  return ok(await cancelGeneration({ userId: user.id, generationId: params.id }), requestId);
});
