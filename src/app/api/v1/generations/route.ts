import { requireUser } from "@/lib/auth/session";
import { apiRoute, parseBody } from "@/lib/http/route";
import { enforceRateLimit } from "@/lib/http/rate-limit";
import { ok } from "@/lib/http/response";
import { createGenerationSchema } from "@/lib/validations";
import { createGeneration, listGenerations } from "@/services/generations/generation-service";

/**
 * GET /api/v1/generations — the customer's own creations, newest first.
 * POST /api/v1/generations — price, reserve, submit.
 *
 * The body names ids only. Cost, model and resolution are resolved server-side
 * from approved configuration, which is why a request cannot buy a cheaper job.
 */

export const GET = apiRoute("generations-list", async ({ request, requestId }) => {
  const user = await requireUser();
  const url = new URL(request.url);
  const style = url.searchParams.get("style");
  const sort = url.searchParams.get("sort") === "oldest" ? "oldest" : "newest";
  const limit = Number(url.searchParams.get("limit") ?? "12");

  return ok(
    await listGenerations({
      userId: user.id,
      style,
      sort,
      cursor: url.searchParams.get("cursor"),
      limit: Number.isFinite(limit) ? limit : 12,
    }),
    requestId,
  );
});

export const POST = apiRoute("generations-create", async ({ request, requestId }) => {
  const user = await requireUser();
  await enforceRateLimit("generations", user.id);

  const body = await parseBody(request, createGenerationSchema);

  const idempotencyKey =
    request.headers.get("idempotency-key")?.trim().slice(0, 120) || body.idempotencyKey || null;

  const result = await createGeneration({
    userId: user.id,
    sourceAssetId: body.sourceAssetId,
    styleId: body.styleId,
    sceneId: body.sceneId,
    qualityId: body.qualityId,
    aspectRatio: body.aspectRatio,
    idempotencyKey,
  });

  return ok(result, requestId, { status: 202 });
});
