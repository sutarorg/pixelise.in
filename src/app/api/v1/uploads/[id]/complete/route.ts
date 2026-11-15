import { requireUser } from "@/lib/auth/session";
import { apiRoute } from "@/lib/http/route";
import { ok } from "@/lib/http/response";
import { completeUpload } from "@/services/uploads/upload-service";

/** POST /api/v1/uploads/{id}/complete — verifies the object that actually landed. */

export const POST = apiRoute<{ id: string }>("uploads-complete", async ({ requestId, params }) => {
  const user = await requireUser();
  return ok(await completeUpload({ userId: user.id, uploadId: params.id }), requestId, { status: 201 });
});
