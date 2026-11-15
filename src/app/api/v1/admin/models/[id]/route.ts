import { requireAdmin } from "@/lib/auth/session";
import { apiRoute, parseBody } from "@/lib/http/route";
import { ok } from "@/lib/http/response";
import { adminModelUpdateSchema } from "@/lib/validations";
import { updateModel } from "@/services/admin/admin-service";

/**
 * PATCH /api/v1/admin/models/{id} — routing switch, availability and the provider
 * cost used for margin reporting. Requires a written reason; audited.
 */

export const PATCH = apiRoute<{ id: string }>("admin-model-update", async ({ request, requestId, params }) => {
  const admin = await requireAdmin("models:write");
  const body = await parseBody(request, adminModelUpdateSchema);

  await updateModel({
    adminId: admin.id,
    modelId: params.id,
    patch: {
      routingEnabled: body.routingEnabled,
      availability: body.availability,
      providerCostUsd: body.providerCostUsd,
    },
    reason: body.reason,
  });

  return ok({ id: params.id, updated: true as const }, requestId);
});
