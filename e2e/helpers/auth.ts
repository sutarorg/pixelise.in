import type { APIRequestContext, Page } from "@playwright/test";

import { adminCredentials, customerCredentials } from "../fixtures/env";

export type Role = "customer" | "customerB" | "admin";

export function credentialsFor(role: Role) {
  if (role === "admin") return adminCredentials;
  if (role === "customerB") {
    return { email: customerCredentials.secondEmail, password: customerCredentials.secondPassword };
  }
  return { email: customerCredentials.email, password: customerCredentials.password };
}

/**
 * Signs in through the real API so the browser context receives the Supabase SSR
 * session cookies. `page.request` shares the context's cookie jar, so the next
 * `page.goto()` is authenticated.
 *
 * Returns the API status so callers can assert on it instead of assuming success.
 */
export async function signIn(page: Page, role: Role): Promise<number> {
  const { email, password } = credentialsFor(role);
  const response = await page.request.post("/api/v1/auth/sign-in", {
    data: { email, password },
    failOnStatusCode: false,
  });
  return response.status();
}

export async function signOut(page: Page): Promise<void> {
  await page.request.post("/api/v1/auth/sign-out", { failOnStatusCode: false });
}

/** Convenience for API-only tests that don't need a browser. */
export async function apiSignIn(request: APIRequestContext, role: Role): Promise<number> {
  const { email, password } = credentialsFor(role);
  const response = await request.post("/api/v1/auth/sign-in", {
    data: { email, password },
    failOnStatusCode: false,
  });
  return response.status();
}
