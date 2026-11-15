import "server-only";

import { serverEnv } from "@/config/env";
import { failures } from "@/lib/http/errors";
import { createLogger } from "@/lib/logging";

/**
 * fal.ai queue adapter.
 *
 * Written against the queue API as documented (docs/research §4):
 *   POST {queue}/{endpoint}                     → request_id, status_url, response_url, cancel_url
 *   GET  {queue}/{endpoint}/requests/{id}/status
 *   GET  {response_url}                         → the model payload
 *   PUT  {cancel_url}                           → cancel while queued
 *
 * No SDK: two endpoints and a bearer header do not justify a dependency, and the
 * plain `fetch` keeps the request/response shapes visible.
 */

const log = createLogger("fal");

export type FalQueueStatus = "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED" | "ERROR" | "CANCELLED";

export interface FalSubmission {
  requestId: string;
  statusUrl: string;
  responseUrl: string;
  cancelUrl: string | null;
}

export interface FalStatus {
  status: FalQueueStatus;
  queuePosition: number | null;
  responseUrl: string | null;
}

function requireKey(): string {
  if (!serverEnv.fal.key) {
    throw failures.notConfigured("Image generation isn't connected yet. Set FAL_KEY.");
  }
  return serverEnv.fal.key;
}

function queueBase(): string {
  return serverEnv.fal.queueBaseUrl.replace(/\/+$/, "");
}

/** Only http(s) on the configured queue host is ever fetched. */
function assertQueueUrl(url: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw failures.unavailable("The image provider returned an unusable URL.");
  }
  const base = new URL(queueBase());
  if (parsed.protocol !== "https:" && parsed.hostname !== "127.0.0.1" && parsed.hostname !== "localhost") {
    throw failures.unavailable("The image provider returned an unusable URL.");
  }
  if (parsed.hostname !== base.hostname && parsed.hostname !== "127.0.0.1" && parsed.hostname !== "localhost") {
    throw failures.unavailable("The image provider returned an unusable URL.");
  }
  return parsed;
}

async function falFetch(url: string, init: RequestInit = {}): Promise<Response> {
  return fetch(url, {
    ...init,
    headers: {
      Authorization: `Key ${requireKey()}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(init.headers ?? {}),
    },
    cache: "no-store",
    redirect: "error",
  });
}

/**
 * Submits a job. The webhook URL is passed as `fal_webhook`; it is a hint, not a
 * trust boundary — the receiver re-reads the job before completing anything.
 */
export async function submitToQueue(input: {
  endpoint: string;
  payload: Record<string, unknown>;
  webhookUrl: string;
}): Promise<FalSubmission> {
  const url = new URL(`${queueBase()}/${input.endpoint.replace(/^\/+/, "")}`);
  url.searchParams.set("fal_webhook", input.webhookUrl);

  const response = await falFetch(url.toString(), {
    method: "POST",
    body: JSON.stringify(input.payload),
  });

  if (!response.ok) {
    const detail = await safeText(response);
    log.error("submit rejected", { status: response.status, endpoint: input.endpoint, detail });
    throw failures.unavailable(
      response.status === 401 || response.status === 403
        ? "The image provider rejected our credentials."
        : "The image provider could not start this generation.",
    );
  }

  // fal returns snake_case fields; we normalise them at this boundary only.
  const body = (await response.json()) as {
    request_id?: string;
    status_url?: string;
    response_url?: string;
    cancel_url?: string;
  };

  if (!body.request_id || !body.response_url) {
    throw failures.unavailable("The image provider returned an unexpected response.");
  }

  return {
    requestId: body.request_id,
    statusUrl: body.status_url ?? `${queueBase()}/${input.endpoint}/requests/${body.request_id}/status`,
    responseUrl: body.response_url,
    cancelUrl: body.cancel_url ?? null,
  };
}

export async function getQueueStatus(statusUrl: string): Promise<FalStatus> {
  const response = await falFetch(assertQueueUrl(statusUrl).toString());
  if (!response.ok) {
    throw failures.unavailable("Could not read the generation status from the provider.");
  }

  const body = (await response.json()) as {
    status?: string;
    queue_position?: number;
    response_url?: string;
  };

  const status = normaliseStatus(body.status);
  return {
    status,
    queuePosition: typeof body.queue_position === "number" ? body.queue_position : null,
    responseUrl: body.response_url ?? null,
  };
}

export interface FalResult {
  images: { url: string; width?: number; height?: number; content_type?: string }[];
}

/**
 * Reads a finished job. fal wraps the model payload in an envelope; the images
 * array is the only field the pipeline depends on.
 */
export async function getQueueResult(responseUrl: string): Promise<FalResult> {
  const response = await falFetch(assertQueueUrl(responseUrl).toString());
  if (!response.ok) {
    throw failures.unavailable("Could not read the generated image from the provider.");
  }

  const body = (await response.json()) as {
    data?: { images?: unknown };
    images?: unknown;
    error?: unknown;
  };

  if (body.error) {
    throw failures.unavailable("The image provider reported a failure for this generation.");
  }

  const raw = (body.data?.images ?? body.images ?? []) as unknown;
  const images = Array.isArray(raw)
    ? raw
        .map((item) => {
          if (!item || typeof item !== "object") return null;
          const image = item as { url?: unknown; width?: unknown; height?: unknown; content_type?: unknown };
          if (typeof image.url !== "string") return null;
          return {
            url: image.url,
            width: typeof image.width === "number" ? image.width : undefined,
            height: typeof image.height === "number" ? image.height : undefined,
            content_type: typeof image.content_type === "string" ? image.content_type : undefined,
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null)
    : [];

  return { images };
}

export async function cancelQueueRequest(cancelUrl: string): Promise<boolean> {
  try {
    const response = await falFetch(assertQueueUrl(cancelUrl).toString(), { method: "PUT" });
    return response.ok;
  } catch {
    return false;
  }
}

function normaliseStatus(value: string | undefined): FalQueueStatus {
  switch (value) {
    case "IN_QUEUE":
    case "IN_PROGRESS":
    case "COMPLETED":
    case "ERROR":
    case "CANCELLED":
      return value;
    default:
      return "IN_PROGRESS";
  }
}

async function safeText(response: Response): Promise<string> {
  try {
    return (await response.text()).slice(0, 200);
  } catch {
    return "";
  }
}
