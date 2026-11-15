import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

/**
 * Unit + service tests.
 *
 * No network, no database, no provider. Anything that would touch Supabase, fal,
 * Razorpay, R2 or Resend is either pure logic here or exercised through a fake at
 * the service boundary. See docs/architecture/security.md §7 for what is covered
 * by the SQL self-test instead.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "test/**/*.test.ts"],
    globals: false,
    reporters: ["default"],
    env: {
      NODE_ENV: "test",
      NEXT_PUBLIC_APP_URL: "http://127.0.0.1:3000",
      RAZORPAY_KEY_ID: "rzp_test_pixelise",
      RAZORPAY_KEY_SECRET: "test_key_secret",
      RAZORPAY_WEBHOOK_SECRET: "test_webhook_secret",
      R2_ACCOUNT_ID: "test-account",
      R2_ACCESS_KEY_ID: "test-access",
      R2_SECRET_ACCESS_KEY: "test-secret",
      R2_BUCKET_NAME: "pixelise-test",
      RESEND_API_KEY: "",
      RESEND_FROM_EMAIL: "",
      FAL_KEY: "",
      SUPABASE_SERVICE_ROLE_KEY: "",
      NEXT_PUBLIC_SUPABASE_URL: "",
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "server-only": fileURLToPath(new URL("./test/stubs/server-only.ts", import.meta.url)),
    },
  },
});
