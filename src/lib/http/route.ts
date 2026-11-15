import type { NextRequest } from "next/server";
import type { ZodType } from "zod";

import { createLogger, describeError } from "@/lib/logging";
import { ApiFailure, failures } from "./errors";
import { getRequestId, readJson } from "./request";
import { fail, ok } from "./response";

export interface RouteContext<P> {
  request: NextRequest;
  requestId: string;
  params: P;
}

type NextRouteContext<P> = { params?: Promise<P> | P };

/**
 * Wraps a route handler with the cross-cutting concerns every endpoint needs:
 * request ids, structured error handling, and a single place where an unknown
 * error becomes a safe 500.
 *
 * Handlers throw `ApiFailure` for anything the customer should see. Everything
 * else is logged with its real message and returned as `internal_error`.
 */
export function apiRoute<P extends Record<string, string> = Record<string, string>>(
  scope: string,
  handler: (context: RouteContext<P>) => Promise<Response>,
) {
  const log = createLogger(scope);

  return async (request: NextRequest, context?: NextRouteContext<P>): Promise<Response> => {
    const requestId = getRequestId(request);
    const route = new URL(request.url).pathname;

    try {
      const params = context?.params ? await context.params : ({} as P);
      return await handler({ request, requestId, params });
    } catch (error) {
      if (error instanceof ApiFailure) {
        log.warn("request failed", {
          requestId,
          route,
          code: error.code,
          status: error.status,
          ...(error.logFields ?? {}),
        });
        return fail(error, requestId);
      }

      log.error("unhandled route error", {
        requestId,
        route,
        error: describeError(error),
      });
      return fail(failures.internal(), requestId);
    }
  };
}

/**
 * Parses a JSON body against a Zod schema, converting issues into per-field
 * messages. Keys are dotted paths (`payment.packId`) so the UI can attach them.
 */
export async function parseBody<T>(request: NextRequest, schema: ZodType<T>): Promise<T> {
  const raw = await readJson(request);
  const result = schema.safeParse(raw);

  if (!result.success) {
    const details: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = issue.path.length ? issue.path.join(".") : "_";
      if (!details[key]) details[key] = issue.message;
    }
    throw failures.validation(details);
  }

  return result.data;
}

/** Convenience for the very common `{ data }` shape. */
export function dataResponse<T>(data: T, requestId: string, status = 200): Response {
  return ok(data, requestId, { status });
}
