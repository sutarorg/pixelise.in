import { requireUser } from "@/lib/auth/session";
import { apiRoute } from "@/lib/http/route";
import { empty, ok } from "@/lib/http/response";
import { deleteGeneration, getGeneration } from "@/services/generations/generation-service";

/** GET /api/v1/generations/{id} — also advances a job that is still running. */

export const GET = apiRoute<{ id: string }>("generation-get", async ({ requestId, params }) => {
  const user = await requireUser();
  return ok(await getGeneration({ userId: user.id, generationId: params.id }), requestId);
});

export const DELETE = apiRoute<{ id: string }>("generation-delete", async ({ requestId, params }) => {
  const user = await requireUser();
  await deleteGeneration({ userId: user.id, generationId: params.id });
  return empty(requestId);
});
