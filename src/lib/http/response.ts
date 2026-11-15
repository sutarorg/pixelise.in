import { NextResponse } from "next/server";

import type { ApiFailure } from "./errors";

/**
 * The response envelope every `/api/v1` route returns:
 *
 *   { "success": true,  "data": ...,             "requestId": "..." }
 *   { "success": false, "error": {code, message}, "requestId": "..." }
 *
 * `src/lib/api/core.ts` unwraps this on the client, so the three frontends keep
 * their existing typed contracts.
 */

export interface ApiSuccessBody<T> {
  success: true;
  data: T;
  requestId: string;
}

export interface ApiFailureBody {
  success: false;
  error: { code: string; message: string; details?: Record<string, string> };
  requestId: string;
}

const noStore = {
  "Cache-Control": "no-store, max-age=0",
  "X-Content-Type-Options": "nosniff",
} as const;

export function ok<T>(
  data: T,
  requestId: string,
  init: { status?: number; headers?: Record<string, string> } = {},
): NextResponse<ApiSuccessBody<T>> {
  return NextResponse.json(
    { success: true as const, data, requestId },
    { status: init.status ?? 200, headers: { ...noStore, ...init.headers, "x-request-id": requestId } },
  );
}

export function fail(failure: ApiFailure, requestId: string): NextResponse<ApiFailureBody> {
  return NextResponse.json(
    {
      success: false as const,
      error: {
        code: failure.code,
        message: failure.message,
        ...(failure.details ? { details: failure.details } : {}),
      },
      requestId,
    },
    {
      status: failure.status,
      headers: { ...noStore, "x-request-id": requestId },
    },
  );
}

/** 204 for deletes: no body, but the same request-id trail. */
export function empty(requestId: string): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: { ...noStore, "x-request-id": requestId },
  });
}
