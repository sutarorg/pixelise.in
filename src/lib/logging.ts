import "server-only";

/**
 * Structured logging.
 *
 * One JSON object per line, which Vercel captures and indexes. Rules:
 *  · never log a secret, a full signed URL, an email body or image bytes;
 *  · always include a request id so a customer's report can be traced;
 *  · provider errors are reduced to a code and a short message before logging,
 *    because raw provider payloads can contain signed URLs.
 */

export type LogLevel = "info" | "warn" | "error";

export interface LogFields {
  requestId?: string | null;
  userId?: string | null;
  route?: string;
  [key: string]: unknown;
}

const REDACTED_KEYS = new Set([
  "authorization",
  "cookie",
  "password",
  "secret",
  "token",
  "apikey",
  "api_key",
  "keysecret",
  "razorpay_signature",
  "x-razorpay-signature",
  "signedurl",
  "uploadurl",
]);

function sanitise(value: unknown, depth = 0): unknown {
  if (value === null || typeof value !== "object") return value;
  if (depth > 3) return "[truncated]";
  if (Array.isArray(value)) return value.slice(0, 20).map((item) => sanitise(item, depth + 1));

  const result: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    result[key] = REDACTED_KEYS.has(key.toLowerCase()) ? "[redacted]" : sanitise(item, depth + 1);
  }
  return result;
}

function emit(level: LogLevel, scope: string, message: string, fields: LogFields = {}): void {
  const entry = {
    level,
    time: new Date().toISOString(),
    scope,
    message,
    ...(sanitise(fields) as Record<string, unknown>),
  };

  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export function createLogger(scope: string) {
  return {
    info: (message: string, fields?: LogFields) => emit("info", scope, message, fields),
    warn: (message: string, fields?: LogFields) => emit("warn", scope, message, fields),
    error: (message: string, fields?: LogFields) => emit("error", scope, message, fields),
  };
}

/**
 * Reduces any thrown value to a safe, loggable shape. Postgres errors carry a
 * message that we do want (`insufficient_credits`), while provider responses do
 * not: only the HTTP status and a provider code are kept.
 */
export function describeError(error: unknown): { name: string; message: string; code?: string } {
  if (error && typeof error === "object") {
    const candidate = error as { name?: string; message?: string; code?: string; status?: number };
    return {
      name: candidate.name ?? "Error",
      message: (candidate.message ?? "unknown").slice(0, 300),
      code: candidate.code ?? (candidate.status ? `http_${candidate.status}` : undefined),
    };
  }
  return { name: "Error", message: String(error).slice(0, 300) };
}
