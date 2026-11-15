/**
 * Where to send a customer after they sign in.
 *
 * The value comes from the URL (`/login?next=/studio`), which the proxy writes
 * when it bounces someone out of a private page. It is never trusted: only a
 * relative path is allowed, so `//evil.example`, `https://evil.example` and
 * `/\evil.example` all fall back to the dashboard instead of leaving the origin.
 */

const FALLBACK = "/dashboard";

export function safeNextPath(value: string | null | undefined): string {
  if (!value) return FALLBACK;

  const candidate = value.trim();
  if (!candidate.startsWith("/")) return FALLBACK;
  /* `//host` is protocol-relative and `/\host` is normalised to `//host` by some
     browsers, so both are treated as off-site. */
  if (candidate.startsWith("//") || candidate.startsWith("/\\")) return FALLBACK;
  /* Control characters can smuggle a newline past naive header/URL handling. */
  if (/[\u0000-\u001f\u007f]/.test(candidate)) return FALLBACK;

  return candidate;
}
