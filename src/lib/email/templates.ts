import { formatCredits, formatDate, formatPaise } from "@/lib/format";

/**
 * Transactional email templates.
 *
 * Plain functions returning HTML + text, so they are testable and so the sender
 * never has to know what a "purchase" is. Every figure shown here is passed in
 * from a stored row (pack snapshot, amount, credits, reference, paid date) — no
 * template recomputes money.
 *
 * Styling is inline and table-free: one container, one card, one CTA. Mail clients
 * ignore most modern CSS, so the design is deliberately plain.
 */

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
  preview: string;
}

const brand = {
  ink: "#141310",
  paper: "#f7f4ee",
  muted: "#6b665c",
  accent: "#c8501e",
  border: "#e4ded2",
};

function layout(input: {
  heading: string;
  preview: string;
  body: string[];
  cta?: { label: string; href: string };
  footnote?: string;
}): string {
  const paragraphs = input.body
    .map(
      (paragraph) =>
        `<p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:${brand.ink};">${paragraph}</p>`,
    )
    .join("");

  const cta = input.cta
    ? `<p style="margin:24px 0 8px;"><a href="${input.cta.href}" style="display:inline-block;background:${brand.ink};color:${brand.paper};padding:12px 20px;border-radius:10px;font-size:14px;font-weight:600;text-decoration:none;">${input.cta.label}</a></p>`
    : "";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(input.heading)}</title>
</head>
<body style="margin:0;padding:32px 16px;background:${brand.paper};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${brand.ink};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(input.preview)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;">
  <tr><td style="padding-bottom:20px;">
    <span style="font-size:15px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;">Pixelise</span>
  </td></tr>
  <tr><td style="background:#ffffff;border:1px solid ${brand.border};border-radius:14px;padding:28px;">
    <h1 style="margin:0 0 18px;font-size:21px;line-height:1.3;font-weight:600;">${escapeHtml(input.heading)}</h1>
    ${paragraphs}
    ${cta}
  </td></tr>
  <tr><td style="padding:18px 4px 0;font-size:12px;line-height:1.6;color:${brand.muted};">
    ${input.footnote ? `<p style="margin:0 0 8px;">${escapeHtml(input.footnote)}</p>` : ""}
    <p style="margin:0;">Pixelise · product photography for small catalogues. You're receiving this because you have a Pixelise account.</p>
  </td></tr>
</table>
</body>
</html>`;
}

export function welcomeEmail(input: { name: string | null; appUrl: string }): EmailContent {
  const greeting = input.name ? `${input.name}, welcome to Pixelise.` : "Welcome to Pixelise.";
  return {
    subject: "Welcome to Pixelise",
    preview: "Your account is ready — upload a product photo to start.",
    html: layout({
      heading: greeting,
      preview: "Your account is ready.",
      body: [
        "Your account is ready. Upload a product photo, choose a photography style and Pixelise will re-stage the product while keeping its packaging, labels and proportions intact.",
        "Credits are sold in two one-time packs. A generation only charges credits once an image has been delivered; if a render fails, the reserved credits come straight back.",
      ],
      cta: { label: "Open the studio", href: `${input.appUrl}/studio` },
    }),
    text: `${greeting}\n\nYour account is ready. Open the studio: ${input.appUrl}/studio\n\nCredits are charged only when an image is delivered. If a render fails, the reserved credits are returned.`,
  };
}

export interface PurchaseEmailInput {
  name: string | null;
  packName: string;
  amountPaise: number;
  credits: number;
  orderId: string;
  paymentId: string;
  paidAt: string;
  balanceAfter: number | null;
  appUrl: string;
}

export function purchaseEmail(input: PurchaseEmailInput): EmailContent {
  const amount = formatPaise(input.amountPaise);
  const credits = formatCredits(input.credits);
  const date = formatDate(input.paidAt);

  return {
    subject: `Receipt — ${input.packName} pack, ${amount}`,
    preview: `${credits} credits added to your Pixelise account.`,
    html: layout({
      heading: `Your ${input.packName} pack is active`,
      preview: `${credits} credits added.`,
      body: [
        `${credits} credits have been added to your account. This is a one-time purchase — there is no subscription and nothing renews.`,
        `<strong>Amount paid:</strong> ${amount}<br><strong>Credits added:</strong> ${credits}<br><strong>Paid on:</strong> ${date}<br><strong>Payment reference:</strong> ${escapeHtml(input.paymentId)}<br><strong>Order reference:</strong> ${escapeHtml(input.orderId)}${input.balanceAfter !== null ? `<br><strong>Balance after purchase:</strong> ${formatCredits(input.balanceAfter)} credits` : ""}`,
        "Keep this email for your records. If anything here doesn't match what you see in your account, reply to this message and we'll look into it.",
      ],
      cta: { label: "View credits", href: `${input.appUrl}/credits` },
    }),
    text: `Your ${input.packName} pack is active.\n\nAmount paid: ${amount}\nCredits added: ${credits}\nPaid on: ${date}\nPayment reference: ${input.paymentId}\nOrder reference: ${input.orderId}${input.balanceAfter !== null ? `\nBalance after purchase: ${input.balanceAfter} credits` : ""}\n\nView credits: ${input.appUrl}/credits`,
  };
}

export function generationCompleteEmail(input: {
  generationId: string;
  styleName: string;
  credits: number;
  appUrl: string;
}): EmailContent {
  return {
    subject: "Your Pixelise render is ready",
    preview: `Your ${input.styleName} image has finished rendering.`,
    html: layout({
      heading: "Your render is ready",
      preview: "Open your creations to download it.",
      body: [
        `Your ${escapeHtml(input.styleName)} image has finished rendering. ${formatCredits(input.credits)} credits were used for this generation.`,
        "Download the full-size file from your creations. Remove a creation whenever you no longer need it.",
      ],
      cta: { label: "Open your creations", href: `${input.appUrl}/creations` },
    }),
    text: `Your ${input.styleName} image is ready. ${input.credits} credits were used.\n\nOpen your creations: ${input.appUrl}/creations`,
  };
}

export function generationFailedEmail(input: {
  styleName: string;
  creditsReturned: number;
  appUrl: string;
}): EmailContent {
  return {
    subject: "Your render didn't complete — credits returned",
    preview: "Your reserved credits have been returned to your balance.",
    html: layout({
      heading: "That render didn't complete",
      preview: "Your credits have been returned.",
      body: [
        `We couldn't finish your ${escapeHtml(input.styleName)} render. ${formatCredits(input.creditsReturned)} credits are back in your balance — you were not charged for this attempt.`,
        "Try again with the same photo, or use a different source image if the product was partly out of frame.",
      ],
      cta: { label: "Try again in the studio", href: `${input.appUrl}/studio` },
    }),
    text: `We couldn't finish your ${input.styleName} render. ${input.creditsReturned} credits have been returned to your balance.\n\nTry again: ${input.appUrl}/studio`,
  };
}

export function accountStatusEmail(input: {
  status: "suspended" | "active";
  reason: string | null;
  appUrl: string;
}): EmailContent {
  const suspended = input.status === "suspended";
  return {
    subject: suspended ? "Your Pixelise account has been paused" : "Your Pixelise account is active again",
    preview: suspended ? "Access is paused while we review your account." : "You can use Pixelise again.",
    html: layout({
      heading: suspended ? "Your account has been paused" : "Your account is active again",
      preview: suspended ? "Access is paused." : "Access restored.",
      body: [
        suspended
          ? "Your Pixelise account has been paused, so studio uploads and generations are unavailable. Your credits and creations are unchanged."
          : "Your Pixelise account is active again. Your credits and creations are exactly as you left them.",
        input.reason ? `Reason recorded: ${escapeHtml(input.reason)}` : "",
        "If you think this is a mistake, reply to this email and a person will review it.",
      ].filter(Boolean),
      cta: { label: "Open Pixelise", href: input.appUrl },
    }),
    text: `${suspended ? "Your Pixelise account has been paused." : "Your account is active again."}${input.reason ? `\nReason recorded: ${input.reason}` : ""}\n\n${input.appUrl}`,
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
