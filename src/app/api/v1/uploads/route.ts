import { requireUser } from "@/lib/auth/session";
import { apiRoute, parseBody } from "@/lib/http/route";
import { enforceRateLimit } from "@/lib/http/rate-limit";
import { ok } from "@/lib/http/response";
import { createUploadSchema } from "@/lib/validations";
import { createUploadTicket } from "@/services/uploads/upload-service";

/**
 * POST /api/v1/uploads — signs one direct-to-R2 upload.
 *
 * The key is derived from the signed-in user, so the ticket cannot be replayed
 * against another account's prefix.
 */

export const POST = apiRoute("uploads-create", async ({ request, requestId }) => {
  const user = await requireUser();
  await enforceRateLimit("uploads", user.id);

  const body = await parseBody(request, createUploadSchema);

  return ok(
    await createUploadTicket({
      userId: user.id,
      filename: body.filename,
      mimeType: body.mimeType,
      bytes: body.bytes,
    }),
    requestId,
    { status: 201 },
  );
});
