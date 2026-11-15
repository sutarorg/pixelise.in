import type { ApiError } from "@/lib/api/types";

/**
 * Customer-facing copy for the four auth flows.
 *
 * The rule mirrors the rest of the app: a failure is never rendered as a success
 * and never exposes a stack trace, a status code or an account-existence hint.
 * The API already writes safe sentences for password and confirmation problems,
 * so those are passed through; everything transport-shaped is rewritten here so
 * each flow can say honestly whether the customer should retry.
 */

export type AuthFlow = "sign-in" | "sign-up" | "recovery" | "update-password";

export interface AuthFailure {
  message: string;
  /** True when repeating the same request could plausibly work. */
  retryable: boolean;
}

const serviceDown: AuthFailure = {
  message:
    "The account service isn't reachable right now. Nothing was changed — try again in a moment.",
  retryable: true,
};

const expiredResetLink: AuthFailure = {
  message: "That reset link has expired or was already used. Request a new one.",
  retryable: false,
};

export function describeAuthFailure(error: ApiError, flow: AuthFlow): AuthFailure {
  switch (error.code) {
    case "unauthenticated":
      /* Sign-in: the route distinguishes "wrong password" from "unconfirmed
         email" without revealing which accounts exist, so keep its wording. */
      return flow === "update-password" ? expiredResetLink : { message: error.message, retryable: false };

    case "validation_failed":
    case "conflict":
      return {
        message: error.message || "Check the details and try again.",
        retryable: false,
      };

    case "rate_limited":
      return {
        message: "That was a lot of attempts in a short time. Wait a minute, then try again.",
        retryable: true,
      };

    case "not_configured":
      return {
        message:
          "Accounts aren't connected in this deployment, so nothing was created or changed.",
        retryable: false,
      };

    case "forbidden":
      return { message: "This account isn't allowed to do that.", retryable: false };

    case "service_unavailable":
    case "internal_error":
    case "network_error":
      return serviceDown;

    default:
      return { message: error.message || serviceDown.message, retryable: error.retryable };
  }
}
