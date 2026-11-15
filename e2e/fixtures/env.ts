/**
 * Environment handling for the E2E suite.
 *
 * Rules encoded here:
 * - Never point at production.
 * - Never use live payment keys. Razorpay test keys start with `rzp_test_`.
 * - Missing staging credentials do not fail the run; they skip the specs that need
 *   them, with an explicit reason, so a green run is never mistaken for full coverage.
 */

// CI passes `E2E_BASE_URL=""` when the repository variable is unset, so blank
// must mean "use the local default" rather than "point at the empty string".
const configuredBaseUrl = process.env.E2E_BASE_URL?.trim();
const rawBaseUrl = configuredBaseUrl ? configuredBaseUrl : "http://127.0.0.1:3100";

export const baseUrl = rawBaseUrl.replace(/\/+$/, "");

export const targetHost = new URL(baseUrl).hostname;

export const isProductionTarget = ["pixelise.in", "www.pixelise.in"].includes(targetHost);

const rzpKeyId = process.env.RAZORPAY_KEY_ID?.trim() ?? "";

/** Only test-mode Razorpay credentials may be used by this suite. */
export const razorpay = {
  keyId: rzpKeyId,
  isTestMode: rzpKeyId.startsWith("rzp_test_"),
  hasKeys: rzpKeyId.length > 0,
  webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET?.trim() ?? "",
};

if (razorpay.hasKeys && !razorpay.isTestMode) {
  throw new Error(
    "RAZORPAY_KEY_ID is not a test key. The E2E suite only runs against Razorpay test mode (rzp_test_…).",
  );
}

export const customerCredentials = {
  email: process.env.E2E_CUSTOMER_EMAIL?.trim() ?? "",
  password: process.env.E2E_CUSTOMER_PASSWORD?.trim() ?? "",
  secondEmail: process.env.E2E_CUSTOMER_B_EMAIL?.trim() ?? "",
  secondPassword: process.env.E2E_CUSTOMER_B_PASSWORD?.trim() ?? "",
};

export const adminCredentials = {
  email: process.env.E2E_ADMIN_EMAIL?.trim() ?? "",
  password: process.env.E2E_ADMIN_PASSWORD?.trim() ?? "",
};

export const hasCustomer = Boolean(customerCredentials.email && customerCredentials.password);
export const hasSecondCustomer = Boolean(customerCredentials.secondEmail && customerCredentials.secondPassword);
export const hasAdmin = Boolean(adminCredentials.email && adminCredentials.password);

export const hasSupabase = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

/** Human-readable reasons for `test.skip`, so a skip explains itself in the report. */
export const skipReasons = {
  customer: "E2E_CUSTOMER_EMAIL / E2E_CUSTOMER_PASSWORD not set (needs staging Supabase + seeded user)",
  secondCustomer: "E2E_CUSTOMER_B_EMAIL / E2E_CUSTOMER_B_PASSWORD not set (needed for cross-user isolation tests)",
  admin: "E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD not set (needs staging Supabase + admin role)",
  razorpay: "RAZORPAY test keys not set — cannot exercise checkout or webhook signature paths",
  database: "NEXT_PUBLIC_SUPABASE_URL / ANON_KEY not set — no database is reachable from this environment",
} as const;
