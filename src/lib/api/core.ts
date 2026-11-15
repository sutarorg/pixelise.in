/**
 * Transport primitives shared by the server and browser API clients.
 *
 * No `next/*` imports live here: this module is bundled into client components
 * as well as server components. Session cookie forwarding is the server
 * client's job (`src/lib/api/server.ts`).
 */

import type { ApiError, ApiErrorCode, ApiResult } from "./types";

export const apiPaths = {
  me: "/api/v1/me",
  /* Auth. The pages call these instead of reaching Supabase directly, so the
     rate limit, the schema and the cookie handling stay server-side. */
  authSignIn: "/api/v1/auth/sign-in",
  authSignUp: "/api/v1/auth/sign-up",
  authRecovery: "/api/v1/auth/recovery",
  authUpdatePassword: "/api/v1/auth/update-password",
  authSignOut: "/api/v1/auth/sign-out",
  preferences: "/api/v1/me/preferences",
  wallet: "/api/v1/credits/wallet",
  transactions: "/api/v1/credits/transactions",
  packs: "/api/v1/credits/packs",
  studioConfig: "/api/v1/studio/config",
  uploads: "/api/v1/uploads",
  uploadComplete: (id: string) => `/api/v1/uploads/${encodeURIComponent(id)}/complete`,
  generations: "/api/v1/generations",
  generation: (id: string) => `/api/v1/generations/${encodeURIComponent(id)}`,
  orders: "/api/v1/billing/orders",
  verifyPayment: "/api/v1/billing/verify",
  payments: "/api/v1/billing/payments",
} as const;

/**
 * Server-side base URL for the workspace API.
 *
 * `PIXELISE_API_BASE_URL` still wins, which is what a split deployment (or a stub
 * service in tests) sets. Otherwise the server talks to *its own* `/api/v1`
 * routes, which is how stage 4 connects the reviewed stage-2/3 pages without
 * rewriting them: same request path, same cookie, same contracts.
 */
function resolveServerBase(): string | null {
  const explicit = normalizeBase(process.env.PIXELISE_API_BASE_URL);
  if (explicit) return explicit;
  if (typeof window !== "undefined") return null;

  const publicOrigin = normalizeBase(process.env.NEXT_PUBLIC_APP_URL);
  if (publicOrigin) return publicOrigin;

  const vercel = normalizeBase(process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL);
  if (vercel) return vercel.startsWith("http") ? vercel : `https://${vercel}`;

  return process.env.NODE_ENV === "development" ? "http://127.0.0.1:3000" : null;
}

export const serverApiBase = resolveServerBase();

/** Browser base URL. Empty string means "same origin". */
export const browserApiBase = normalizeBase(process.env.NEXT_PUBLIC_API_BASE_URL) ?? "";

function normalizeBase(value: string | undefined): string | null {
  const trimmed = value?.trim().replace(/\/+$/, "");
  return trimmed && trimmed.length > 0 ? trimmed : null;
}

/** True when this build can talk to the workspace service at all. */
export const workspaceServiceConfigured = Boolean(serverApiBase || browserApiBase);

const messages: Record<ApiErrorCode, string> = {
  unauthenticated: "Your session has expired. Sign in again to continue.",
  forbidden: "You do not have access to this item.",
  not_found: "We couldn't find that item. It may have been deleted.",
  validation_failed: "Some details need fixing before we can continue.",
  insufficient_credits: "You don't have enough credits for this generation.",
  rate_limited: "That was a lot of requests in a short time. Try again in a moment.",
  conflict: "That request was already sent with different details. Reload and try again.",
  payment_failed: "The payment did not go through. No credits were added.",
  service_unavailable: "The Pixelise service isn't reachable right now.",
  not_configured: "This workspace isn't connected to the Pixelise service yet.",
  network_error: "We couldn't reach the network. Check your connection and try again.",
  internal_error: "Something went wrong on our side. Nothing was charged.",
};

export function apiError(
  code: ApiErrorCode,
  overrides: Partial<Omit<ApiError, "code">> = {},
): ApiError {
  return {
    code,
    message: overrides.message ?? messages[code],
    status: overrides.status ?? statusFor(code),
    retryable: overrides.retryable ?? retryableFor(code),
    requestId: overrides.requestId ?? null,
  };
}

function statusFor(code: ApiErrorCode): number {
  switch (code) {
    case "unauthenticated":
      return 401;
    case "forbidden":
      return 403;
    case "not_found":
      return 404;
    case "validation_failed":
      return 422;
    case "insufficient_credits":
    case "payment_failed":
      return 402;
    case "rate_limited":
      return 429;
    case "conflict":
      return 409;
    case "service_unavailable":
    case "not_configured":
      return 503;
    case "network_error":
      return 0;
    default:
      return 500;
  }
}

function retryableFor(code: ApiErrorCode): boolean {
  return code === "rate_limited" || code === "service_unavailable" || code === "network_error";
}

/** Maps an HTTP status + server payload onto a customer-safe error. */
export function errorFromResponse(status: number, payload: unknown): ApiError {
  const body = (payload ?? {}) as {
    error?: { code?: string; message?: string; requestId?: string };
    message?: string;
  };
  /* The service may speak either casing; both map to the same enum. */
  const rawCode = body.error?.code?.toLowerCase();
  const known: ApiErrorCode[] = [
    "unauthenticated",
    "forbidden",
    "not_found",
    "validation_failed",
    "insufficient_credits",
    "rate_limited",
    "conflict",
    "payment_failed",
    "service_unavailable",
    "internal_error",
  ];
  const code: ApiErrorCode =
    rawCode && (known as string[]).includes(rawCode)
      ? (rawCode as ApiErrorCode)
      : status === 401
        ? "unauthenticated"
        : status === 403
          ? "forbidden"
          : status === 404
            ? "not_found"
            : status === 402
              ? "insufficient_credits"
              : status === 422
                ? "validation_failed"
                : status === 429
                  ? "rate_limited"
                  : status >= 500
                    ? "service_unavailable"
                    : "internal_error";

  return apiError(code, {
    status,
    /* Only trust a message the service wrote; never surface a stack trace. */
    message: body.error?.message ?? body.message ?? undefined,
    requestId: body.error?.requestId ?? null,
  });
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  /** Extra headers (session cookie on the server, idempotency keys anywhere). */
  headers?: Record<string, string>;
  signal?: AbortSignal;
  /** Server-side base URL. Ignored in the browser. */
  baseUrl?: string | null;
}

const REQUEST_TIMEOUT_MS = 12_000;

/**
 * One request, one `ApiResult`. Never throws: callers render designed states
 * for "unavailable" and "unauthorized" instead of catching exceptions.
 */
export async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<ApiResult<T>> {
  const isServer = typeof window === "undefined";
  const base = isServer ? (options.baseUrl ?? serverApiBase) : browserApiBase;

  if (isServer && !base) {
    return { ok: false, error: apiError("not_configured") };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const signal = options.signal ?? controller.signal;

  try {
    const response = await fetch(`${base ?? ""}${path}`, {
      method: options.method ?? "GET",
      headers: {
        Accept: "application/json",
        ...(options.body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      credentials: isServer ? "omit" : "include",
      cache: "no-store",
      signal,
    });

    const text = await response.text();
    const payload = text ? safeJson(text) : null;

    if (!response.ok) {
      /* A non-JSON body means we did not reach the service (proxy page, HTML
         error document, gateway timeout) — report that honestly rather than
         pretending the resource is missing. */
      if (payload === null) {
        return {
          ok: false,
          error: apiError("service_unavailable", { status: response.status }),
        };
      }
      return { ok: false, error: errorFromResponse(response.status, payload) };
    }

    return { ok: true, data: payload as T };
  } catch {
    return { ok: false, error: apiError("network_error") };
  } finally {
    clearTimeout(timeout);
  }
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** Query-string helper that drops empty values. */
export function withQuery(path: string, params: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const query = search.toString();
  return query ? `${path}?${query}` : path;
}
