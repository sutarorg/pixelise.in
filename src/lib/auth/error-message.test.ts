import { describe, expect, it } from "vitest";

import { describeAuthFailure } from "./error-message";
import type { ApiError } from "@/lib/api/types";

const error = (overrides: Partial<ApiError>): ApiError => ({
  code: "internal_error",
  message: "Something went wrong.",
  status: 500,
  retryable: false,
  requestId: null,
  ...overrides,
});

describe("describeAuthFailure", () => {
  it("keeps the sign-in route's wording for a rejected password", () => {
    const failure = describeAuthFailure(
      error({ code: "unauthenticated", message: "Email or password is incorrect.", status: 401 }),
      "sign-in",
    );

    expect(failure.message).toBe("Email or password is incorrect.");
    expect(failure.retryable).toBe(false);
  });

  it("treats an expired session during a password reset as an expired link", () => {
    const failure = describeAuthFailure(
      error({ code: "unauthenticated", message: "Sign in required.", status: 401 }),
      "update-password",
    );

    expect(failure.message).toMatch(/reset link has expired/i);
    expect(failure.retryable).toBe(false);
  });

  it("passes through the server's validation sentence", () => {
    const failure = describeAuthFailure(
      error({
        code: "validation_failed",
        message: "An account already exists for that email. Sign in instead.",
        status: 422,
      }),
      "sign-up",
    );

    expect(failure.message).toBe("An account already exists for that email. Sign in instead.");
    expect(failure.retryable).toBe(false);
  });

  it("tells a rate-limited customer to wait instead of blaming their details", () => {
    const failure = describeAuthFailure(
      error({ code: "rate_limited", message: "Too many requests.", status: 429 }),
      "sign-in",
    );

    expect(failure.message).toMatch(/wait a minute/i);
    expect(failure.retryable).toBe(true);
  });

  it("never claims an account was created when the deployment has no auth", () => {
    const failure = describeAuthFailure(
      error({ code: "not_configured", message: "Not configured.", status: 503 }),
      "sign-up",
    );

    expect(failure.message).toMatch(/aren't connected/i);
    expect(failure.message).toMatch(/nothing was created/i);
    expect(failure.retryable).toBe(false);
  });

  it("maps every transport failure to one honest retryable message", () => {
    for (const code of ["service_unavailable", "internal_error", "network_error"] as const) {
      const failure = describeAuthFailure(error({ code, status: 0 }), "recovery");
      expect(failure.message).toMatch(/isn't reachable right now/i);
      expect(failure.retryable).toBe(true);
    }
  });

  it("falls back to the server sentence rather than inventing one", () => {
    const failure = describeAuthFailure(
      error({ code: "forbidden", message: "This account was suspended.", status: 403 }),
      "sign-in",
    );

    expect(failure.message).toBe("This account isn't allowed to do that.");
  });
});
