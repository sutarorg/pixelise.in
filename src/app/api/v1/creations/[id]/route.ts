import { requireUser } from "@/lib/auth/session";
import { apiRoute } from "@/lib/http/route";
import { empty, ok } from "@/lib/http/response";
import { deleteGeneration, getGeneration } from "@/services/generations/generation-service";

export const GET = apiRoute<{ id: string }>("creation-get", async ({ requestId, params }) => {
  const user = await requireUser();
  return ok(await getGeneration({ userId: user.id, generationId: params.id }), requestId);
});

/** DELETE /api/v1/creations/{id} — soft delete; the audit trail stays. */
export const DELETE = apiRoute<{ id: string }>("creation-delete", async ({ requestId, params }) => {
  const user = await requireUser();
  await deleteGeneration({ userId: user.id, generationId: params.id });
  return empty(requestId);
});
