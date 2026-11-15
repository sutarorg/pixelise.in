import { requireAdmin } from "@/lib/auth/session";
import { apiRoute, parseBody } from "@/lib/http/route";
import { ok } from "@/lib/http/response";
import { adminPricingSchema } from "@/lib/validations";
import { listPricing, upsertPricing } from "@/services/admin/admin-service";

/**
 * Generation credit pricing.
 *
 * POST is how a rate becomes real. `approved: false` keeps the studio in
 * "pricing not configured"; `approved: true` is the owner's explicit decision to
 * charge that many credits, and from then on the generation API will charge it.
 */

export const GET = apiRoute("admin-pricing", async ({ requestId }) => {
  await requireAdmin("audit:read");
  return ok(await listPricing(), requestId);
});

export const POST = apiRoute("admin-pricing-upsert", async ({ request, requestId }) => {
  const admin = await requireAdmin("config:write");
  const body = await parseBody(request, adminPricingSchema);

  await upsertPricing({
    adminId: admin.id,
    styleId: body.styleId,
    qualityId: body.qualityId,
    resolution: body.resolution ?? null,
    credits: body.credits,
    approved: body.approved,
    notes: body.notes ?? null,
  });

  return ok({ styleId: body.styleId, qualityId: body.qualityId, approved: body.approved }, requestId);
});
