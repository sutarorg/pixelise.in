import "server-only";

/**
 * Server environment.
 *
 * One module reads `process.env` for the whole backend so that:
 *  - missing configuration is a first-class, typed state (`features.*`), not a crash;
 *  - no secret is read anywhere else, which makes auditing imports trivial;
 *  - the error message for an unconfigured integration always says what to set.
 *
 * Nothing here is exposed to the browser. The only public values are the
 * Supabase URL and publishable/anon key, read by `lib/supabase/browser.ts`
 * through `NEXT_PUBLIC_*` variables.
 */

function clean(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

const isProduction = process.env.NODE_ENV === "production";

/** Public origin of this deployment, used for self-referential API calls and emails. */
function resolveAppUrl(): string {
  const explicit = clean(process.env.NEXT_PUBLIC_APP_URL);
  if (explicit) return explicit.replace(/\/+$/, "");
  const vercel = clean(process.env.VERCEL_PROJECT_PRODUCTION_URL) ?? clean(process.env.VERCEL_URL);
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, "").replace(/\/+$/, "")}`;
  return "http://127.0.0.1:3000";
}

export const serverEnv = {
  isProduction,
  appUrl: resolveAppUrl(),

  supabase: {
    url: clean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    publishableKey:
      clean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ??
      clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    serviceRoleKey: clean(process.env.SUPABASE_SERVICE_ROLE_KEY),
  },

  fal: {
    key: clean(process.env.FAL_KEY),
    webhookSecret: clean(process.env.FAL_WEBHOOK_SECRET),
    /** Optional override so a deployment can point at a stub in tests. */
    queueBaseUrl: clean(process.env.FAL_QUEUE_BASE_URL) ?? "https://queue.fal.run",
  },

  razorpay: {
    keyId: clean(process.env.RAZORPAY_KEY_ID),
    keySecret: clean(process.env.RAZORPAY_KEY_SECRET),
    webhookSecret: clean(process.env.RAZORPAY_WEBHOOK_SECRET),
    apiBaseUrl: clean(process.env.RAZORPAY_API_BASE_URL) ?? "https://api.razorpay.com/v1",
  },

  r2: {
    accountId: clean(process.env.R2_ACCOUNT_ID),
    accessKeyId: clean(process.env.R2_ACCESS_KEY_ID),
    secretAccessKey: clean(process.env.R2_SECRET_ACCESS_KEY),
    bucket: clean(process.env.R2_BUCKET_NAME),
    endpoint: clean(process.env.R2_ENDPOINT),
  },

  /** Vercel cron authentication. Set to a long random string. */
  cronSecret: clean(process.env.CRON_SECRET),

  resend: {
    apiKey: clean(process.env.RESEND_API_KEY),
    from: clean(process.env.RESEND_FROM_EMAIL),
  },
} as const;

/**
 * What this deployment can actually do. Routes check these before touching a
 * provider and return `not_configured` instead of pretending to succeed.
 */
export const features = {
  supabase: Boolean(serverEnv.supabase.url && serverEnv.supabase.serviceRoleKey),
  fal: Boolean(serverEnv.fal.key),
  razorpay: Boolean(serverEnv.razorpay.keyId && serverEnv.razorpay.keySecret),
  razorpayWebhooks: Boolean(serverEnv.razorpay.webhookSecret),
  r2: Boolean(
    serverEnv.r2.accountId &&
      serverEnv.r2.accessKeyId &&
      serverEnv.r2.secretAccessKey &&
      serverEnv.r2.bucket,
  ),
  resend: Boolean(serverEnv.resend.apiKey && serverEnv.resend.from),
} as const;

export type FeatureName = keyof typeof features;

/** Names of missing variables for one feature, for an actionable log line. */
export function missingEnvFor(feature: FeatureName): string[] {
  switch (feature) {
    case "supabase":
      return [
        ...(serverEnv.supabase.url ? [] : ["NEXT_PUBLIC_SUPABASE_URL"]),
        ...(serverEnv.supabase.serviceRoleKey ? [] : ["SUPABASE_SERVICE_ROLE_KEY"]),
      ];
    case "fal":
      return serverEnv.fal.key ? [] : ["FAL_KEY"];
    case "razorpay":
      return [
        ...(serverEnv.razorpay.keyId ? [] : ["RAZORPAY_KEY_ID"]),
        ...(serverEnv.razorpay.keySecret ? [] : ["RAZORPAY_KEY_SECRET"]),
      ];
    case "r2":
      return [
        ...(serverEnv.r2.accountId ? [] : ["R2_ACCOUNT_ID"]),
        ...(serverEnv.r2.accessKeyId ? [] : ["R2_ACCESS_KEY_ID"]),
        ...(serverEnv.r2.secretAccessKey ? [] : ["R2_SECRET_ACCESS_KEY"]),
        ...(serverEnv.r2.bucket ? [] : ["R2_BUCKET_NAME"]),
      ];
    default:
      return [];
  }
}
