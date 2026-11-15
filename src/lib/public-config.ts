import "server-only";

import { features } from "@/config/env";

/**
 * Public capability flags.
 *
 * Booleans only — never a key, an account id or a provider hostname. The
 * marketing site uses these to show an honest "not yet available" state instead
 * of a form that silently fails.
 */
export function defaultsForPublicSite() {
  return {
    auth: features.supabase,
    studio: features.supabase && features.fal && features.r2,
    payments: features.razorpay,
    email: features.resend,
    storage: features.r2,
  };
}
