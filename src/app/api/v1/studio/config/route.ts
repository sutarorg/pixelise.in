import { apiRoute } from "@/lib/http/route";
import { ok } from "@/lib/http/response";
import { getStudioConfig } from "@/services/studio/studio-config-service";

/**
 * GET /api/v1/studio/config — styles, scenes, aspect ratios, qualities and the
 * upload limits the server enforces.
 *
 * Quality credit costs are `null` until the owner approves a rate, which is how
 * the studio knows to say "pricing not configured" instead of showing a number
 * nobody agreed to.
 */

export const GET = apiRoute("studio-config", async ({ requestId }) =>
  ok(await getStudioConfig(), requestId),
);
