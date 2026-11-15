import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { ApiFailure, failures } from "@/lib/http/errors";
import { apiRoute } from "@/lib/http/route";
import { ok } from "@/lib/http/response";

function request(path = "http://127.0.0.1:3000/api/v1/test"): NextRequest {
  return new NextRequest(new URL(path), { method: "GET" });
}

async function body<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

describe("API envelope", () => {
  it("wraps success data with a request id", async () => {
    const handler = apiRoute("test", async ({ requestId }) => ok({ hello: "world" }, requestId));

    const response = await handler(request());
    const json = await body<{ success: boolean; data: { hello: string }; requestId: string }>(response);

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.hello).toBe("world");
    expect(json.requestId).toMatch(/[0-9a-f-]{8,}/);
    expect(response.headers.get("cache-control")).toContain("no-store");
  });

  it("echoes a caller-supplied request id so support can correlate logs", async () => {
    const handler = apiRoute("test", async () => {
      throw failures.notFound();
    });

    const req = new NextRequest(new URL("http://127.0.0.1:3000/api/v1/test"), {
      headers: { "x-request-id": "support-ticket-1234" },
    });

    const json = await body<{ requestId: string }>(await handler(req));
    expect(json.requestId).toBe("support-ticket-1234");
  });

  it("renders a known failure with its code, status and message", async () => {
    const handler = apiRoute("test", async () => {
      throw failures.insufficientCredits();
    });

    const response = await handler(request());
    const json = await body<{ success: boolean; error: { code: string; message: string } }>(response);

    expect(response.status).toBe(402);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("insufficient_credits");
    expect(json.error.message).toBe("You don't have enough credits for this generation.");
  });

  it("attaches field errors without leaking the parser message", async () => {
    const handler = apiRoute("test", async () => {
      throw failures.validation({ packId: "Choose one of the available packs." });
    });

    const response = await handler(request());
    const json = await body<{ error: { code: string; details?: Record<string, string> } }>(response);

    expect(json.error.code).toBe("validation_failed");
    expect(json.error.details).toEqual({ packId: "Choose one of the available packs." });
  });

  it("turns an unexpected error into a safe 500 with no internals", async () => {
    const handler = apiRoute("test", async () => {
      throw new Error("postgres://user:pass@db.internal:5432 exploded");
    });

    const response = await handler(request());
    const text = JSON.stringify(await body(response));

    expect(response.status).toBe(500);
    expect(text).toContain("internal_error");
    expect(text).not.toContain("postgres");
    expect(text).not.toContain("db.internal");
    expect(text).not.toContain("stack");
  });

  it("keeps ApiFailure statuses aligned with the client contract", () => {
    expect(new ApiFailure("unauthenticated").status).toBe(401);
    expect(new ApiFailure("forbidden").status).toBe(403);
    expect(new ApiFailure("not_found").status).toBe(404);
    expect(new ApiFailure("conflict").status).toBe(409);
    expect(new ApiFailure("rate_limited").status).toBe(429);
    expect(new ApiFailure("not_configured").status).toBe(503);
  });
});
