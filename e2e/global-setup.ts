import { existsSync } from "node:fs";

import {
  baseUrl,
  hasAdmin,
  hasCustomer,
  hasSecondCustomer,
  isProductionTarget,
  razorpay,
} from "./fixtures/env";

/**
 * Fails fast with an actionable message instead of letting 40 tests time out
 * against a server that was never built.
 */
export default async function globalSetup() {
  if (isProductionTarget) {
    throw new Error("E2E target resolves to the production domain. Aborting.");
  }

  if (!existsSync(".next/BUILD_ID")) {
    throw new Error(
      "No production build found (.next/BUILD_ID missing). Run `npm run build` before `npm run test:e2e`.",
    );
  }

  const roles = [
    `customer=${hasCustomer ? "yes" : "SKIP"}`,
    `second customer=${hasSecondCustomer ? "yes" : "SKIP"}`,
    `admin=${hasAdmin ? "yes" : "SKIP"}`,
    `razorpay=${razorpay.isTestMode ? "test-mode" : "SKIP"}`,
  ];

  console.log(`[e2e] target ${baseUrl} · ${roles.join(" · ")}`);

  if (!hasCustomer || !hasAdmin) {
    console.warn(
      "[e2e] Some roles are unavailable. Those specs will be reported as SKIPPED, not passed. " +
        "See .env.e2e.example and docs/research/e2e-testing-research.md §4.",
    );
  }
}
