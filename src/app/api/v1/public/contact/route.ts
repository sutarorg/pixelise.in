import { contactTopics, type ContactResponse } from "@/lib/contact/contract";
import { apiRoute, parseBody } from "@/lib/http/route";
import { failures } from "@/lib/http/errors";
import { getClientIp, hashIp } from "@/lib/http/request";
import { ok } from "@/lib/http/response";
import { enforceRateLimit } from "@/lib/http/rate-limit";
import { contactSchema } from "@/lib/validations";
import { submitContactMessage } from "@/services/contact/contact-service";

/**
 * POST /api/v1/public/contact — the marketing site's contact form.
 *
 * Rate limited per hashed IP, honeypot-checked, and validated with the same
 * limits the form uses (`contactLimits`), so a message can never be accepted by
 * the UI and rejected by the service for a different reason.
 */
export const POST = apiRoute("contact", async ({ request, requestId }) => {
  const ip = getClientIp(request);
  await enforceRateLimit("contact", ip);

  const body = await parseBody(request, contactSchema);

  // A filled honeypot is a bot. Answer 202 with no reference and store nothing.
  if (body.website && body.website.length > 0) {
    return ok<ContactResponse>({ ok: true, ticketId: "RECEIVED" }, requestId, { status: 202 });
  }

  if (!contactTopics.includes(body.topic as never)) {
    throw failures.validation({ topic: "Choose a topic." });
  }

  const result = await submitContactMessage({
    name: body.name,
    email: body.email,
    topic: body.topic as (typeof contactTopics)[number],
    message: body.message,
    sourcePath: body.sourcePath ?? null,
    ipHash: hashIp(ip),
  });

  return ok<ContactResponse>({ ok: true, ticketId: result.ticketId }, requestId, { status: 201 });
});
