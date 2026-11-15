import "server-only";

import { contactTopicLabels, type ContactTopic } from "@/lib/contact/contract";
import { createLogger } from "@/lib/logging";
import { sendEmail } from "@/lib/email/resend";
import { getServiceClient } from "@/lib/supabase/service";

/**
 * Support inbox.
 *
 * Messages are stored first — that row is the record — and the notification is
 * best-effort. A mail outage must not lose a customer's message, and the visitor
 * always gets a reference they can quote.
 */

const log = createLogger("contact");

export async function submitContactMessage(input: {
  name: string;
  email: string;
  topic: ContactTopic;
  message: string;
  sourcePath: string | null;
  ipHash: string;
}): Promise<{ ticketId: string }> {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("contact_messages")
    .insert({
      name: input.name,
      email: input.email,
      topic: input.topic,
      message: input.message,
      source_path: input.sourcePath,
      ip_hash: input.ipHash,
    })
    .select("id")
    .single();

  if (error || !data) {
    log.error("message insert failed", { code: error?.code });
    throw new Error("contact_insert_failed");
  }

  const ticketId = (data.id as string).slice(0, 8).toUpperCase();

  const { data: setting } = await supabase
    .from("system_settings")
    .select("value")
    .eq("key", "support.recipient")
    .maybeSingle();

  const recipient = typeof setting?.value === "string" ? setting.value : null;

  if (recipient) {
    await sendEmail({
      to: recipient,
      replyTo: input.email,
      content: {
        subject: `[${ticketId}] ${contactTopicLabels[input.topic]} — ${input.name}`,
        preview: input.message.slice(0, 120),
        html: `<p><strong>${escapeHtml(input.name)}</strong> &lt;${escapeHtml(input.email)}&gt;</p><p><strong>Topic:</strong> ${escapeHtml(contactTopicLabels[input.topic])}</p><p><strong>Page:</strong> ${escapeHtml(input.sourcePath ?? "unknown")}</p><hr><p>${escapeHtml(input.message).replace(/\n/g, "<br>")}</p>`,
        text: `${input.name} <${input.email}>\n${contactTopicLabels[input.topic]}\n${input.sourcePath ?? ""}\n\n${input.message}`,
      },
    });
  }

  return { ticketId };
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
