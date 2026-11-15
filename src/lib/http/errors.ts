/**
 * API error primitives.
 *
 * The codes are the ones the frontends already switch on (`src/lib/api/types.ts`),
 * so a route never has to invent a message. Anything a customer should not see —
 * stack traces, provider errors, SQL text, internal hostnames — stays in the log.
 */

import type { ApiErrorCode } from "@/lib/api/types";

export type ApiFailureCode = ApiErrorCode;

const statusByCode: Record<ApiFailureCode, number> = {
  unauthenticated: 401,
  forbidden: 403,
  not_found: 404,
  validation_failed: 422,
  insufficient_credits: 402,
  rate_limited: 429,
  conflict: 409,
  payment_failed: 402,
  service_unavailable: 503,
  not_configured: 503,
  network_error: 502,
  internal_error: 500,
};

const defaultMessages: Record<ApiFailureCode, string> = {
  unauthenticated: "Sign in to continue.",
  forbidden: "You don't have access to this.",
  not_found: "We couldn't find that item.",
  validation_failed: "Some details need fixing before we can continue.",
  insufficient_credits: "You don't have enough credits for this generation.",
  rate_limited: "Too many requests. Try again in a moment.",
  conflict: "That request was already sent with different details.",
  payment_failed: "The payment did not go through. No credits were added.",
  service_unavailable: "The service isn't reachable right now.",
  not_configured: "This feature isn't connected yet.",
  network_error: "We couldn't reach the network. Try again.",
  internal_error: "Something went wrong on our side.",
};

export class ApiFailure extends Error {
  readonly code: ApiFailureCode;
  readonly status: number;
  readonly details?: Record<string, string>;
  readonly logFields?: Record<string, unknown>;

  constructor(
    code: ApiFailureCode,
    options: {
      message?: string;
      details?: Record<string, string>;
      logFields?: Record<string, unknown>;
    } = {},
  ) {
    super(options.message ?? defaultMessages[code]);
    this.name = "ApiFailure";
    this.code = code;
    this.status = statusByCode[code];
    this.details = options.details;
    this.logFields = options.logFields;
  }
}

export const failures = {
  unauthenticated: (message?: string) => new ApiFailure("unauthenticated", { message }),
  forbidden: (message?: string) => new ApiFailure("forbidden", { message }),
  notFound: (message?: string) => new ApiFailure("not_found", { message }),
  validation: (details?: Record<string, string>, message?: string) =>
    new ApiFailure("validation_failed", { details, message }),
  insufficientCredits: () => new ApiFailure("insufficient_credits"),
  rateLimited: (message = "Too many requests. Try again in a moment.") =>
    new ApiFailure("rate_limited", { message }),
  conflict: (message?: string) => new ApiFailure("conflict", { message }),
  paymentFailed: (message?: string) => new ApiFailure("payment_failed", { message }),
  unavailable: (message?: string) => new ApiFailure("service_unavailable", { message }),
  notConfigured: (message?: string) => new ApiFailure("not_configured", { message }),
  internal: () => new ApiFailure("internal_error"),
} as const;

/** HTTP status for a code, reused by the fetch-level client shim in tests. */
export function statusForCode(code: ApiFailureCode): number {
  return statusByCode[code];
}
