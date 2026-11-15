/**
 * Query-string helpers for the console.
 *
 * Every filter, sort and cursor lives in the URL: the server components read it,
 * the API receives it, and a filtered view can be pasted into a ticket. No filter
 * state is held in React.
 */

export type RawSearchParams = Record<string, string | string[] | undefined>;

export function readParam(params: RawSearchParams, key: string): string | undefined {
  const value = params[key];
  const first = Array.isArray(value) ? value[0] : value;
  const trimmed = first?.trim();
  if (!trimmed) return undefined;
  /* Guard against someone pasting a novel into the query string. */
  return trimmed.slice(0, 120);
}

export function readEnum<T extends string>(
  params: RawSearchParams,
  key: string,
  allowed: readonly T[],
  fallback: T,
): T {
  const value = readParam(params, key);
  return value && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

export function readInt(
  params: RawSearchParams,
  key: string,
  { min, max, fallback }: { min: number; max: number; fallback: number },
): number {
  const value = Number.parseInt(readParam(params, key) ?? "", 10);
  if (Number.isNaN(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

export type QueryRecord = Record<string, string | number | undefined>;

/** Builds `/path?query`, dropping empty values. */
export function buildHref(base: string, query: QueryRecord): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === "") continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `${base}?${qs}` : base;
}

/** Drops cursor/keys that must reset whenever a filter changes. */
export function withFilters(
  params: RawSearchParams,
  next: QueryRecord,
  { resetCursor = true }: { resetCursor?: boolean } = {},
): QueryRecord {
  const query: QueryRecord = { ...next };
  if (!resetCursor) {
    const cursor = readParam(params, "cursor");
    if (cursor) query.cursor = cursor;
  }
  return query;
}

/** Date range shared by every list endpoint. */
export type PeriodRange = "7d" | "30d" | "90d";
export type PeriodQuery = { range?: PeriodRange; from?: string; to?: string };

export function readPeriod(params: RawSearchParams): PeriodQuery {
  const from = readParam(params, "from");
  const to = readParam(params, "to");
  if (from && to) return { from, to };
  const range = readEnum(params, "range", ["7d", "30d", "90d"] as const, "30d");
  return { range };
}

/** Passes the active period through links that should keep it. */
export function periodParams(params: RawSearchParams): QueryRecord {
  const { range, from, to } = readPeriod(params);
  return from && to ? { from, to } : { range };
}

export function paginationParams(params: RawSearchParams): { cursor?: string } {
  const cursor = readParam(params, "cursor");
  return cursor ? { cursor } : {};
}
