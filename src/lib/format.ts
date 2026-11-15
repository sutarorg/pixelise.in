/**
 * Presentation formatting.
 *
 * Dates use a fixed locale and time zone so the server-rendered markup and the
 * client agree byte-for-byte (no hydration mismatch), and so every customer
 * sees the same Indian-market formatting the marketing site uses.
 */

const LOCALE = "en-IN";
const TIME_ZONE = "Asia/Kolkata";

const creditFormatter = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 });

export function formatCredits(value: number): string {
  return creditFormatter.format(value);
}

/** Paise → "₹999". */
export function formatPaise(paise: number): string {
  return new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: paise % 100 === 0 ? 0 : 2,
    minimumFractionDigits: 0,
  }).format(paise / 100);
}

const dateTimeFormatter = new Intl.DateTimeFormat(LOCALE, {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: TIME_ZONE,
});

const dateFormatter = new Intl.DateTimeFormat(LOCALE, {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: TIME_ZONE,
});

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.valueOf()) ? "—" : dateTimeFormatter.format(date);
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.valueOf()) ? "—" : dateFormatter.format(date);
}

/** "+150" / "−12" — signed credit movement for tables. */
export function formatCreditDelta(value: number): string {
  if (value === 0) return "0";
  const sign = value > 0 ? "+" : "−";
  return `${sign}${formatCredits(Math.abs(value))}`;
}

/** 1.8 MB, 640 KB — file sizes for the uploader. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(kb / 1024 >= 10 ? 0 : 1)} MB`;
}

export function pluralise(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural ?? `${singular}s`);
}
