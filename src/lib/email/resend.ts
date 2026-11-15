import "server-only";

import { serverEnv } from "@/config/env";
import { createLogger } from "@/lib/logging";
import type { EmailContent } from "./templates";

/**
 * Resend adapter.
 *
 * Email is best-effort by design: a mail outage must never roll back a payment,
 * a credit grant or a rendered image. `sendEmail` therefore never throws — it
 * returns false and logs, and the caller carries on.
 */

const log = createLogger("email");

export function isEmailConfigured(): boolean {
  return Boolean(serverEnv.resend.apiKey && serverEnv.resend.from);
}

export async function sendEmail(input: {
  to: string;
  content: EmailContent;
  /** Reply-to for support-style messages. Optional on purpose. */
  replyTo?: string;
  idempotencyKey?: string;
}): Promise<boolean> {
  if (!isEmailConfigured()) {
    log.warn("email not configured — skipped", { subject: input.content.subject });
    return false;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serverEnv.resend.apiKey}`,
        "Content-Type": "application/json",
        ...(input.idempotencyKey ? { "Idempotency-Key": input.idempotencyKey } : {}),
      },
      body: JSON.stringify({
        from: serverEnv.resend.from,
        to: [input.to],
        subject: input.content.subject,
        html: input.content.html,
        text: input.content.text,
        ...(input.replyTo ? { reply_to: input.replyTo } : {}),
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      log.error("send failed", { status: response.status, detail: body.slice(0, 200) });
      return false;
    }

    return true;
  } catch (error) {
    log.error("send threw", { error: error instanceof Error ? error.message : String(error) });
    return false;
  }
}
