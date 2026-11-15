import Link from "next/link";
import { CalendarDays } from "lucide-react";

import { cn } from "@/lib/utils";
import { buildHref, type QueryRecord } from "@/lib/admin-filters";

const presets = [
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
  { id: "90d", label: "Last 90 days" },
] as const;

/**
 * Period control shared by every list page.
 *
 * Presets are links; a custom range is a GET form with two native date inputs.
 * The server resolves the preset into concrete dates and returns the label, so
 * the browser never has to know what "last 30 days" means in the backend's
 * timezone.
 */
export function DateRangeFilter({
  basePath,
  preserve,
  activeRange,
  from,
  to,
  label = "Period",
}: {
  basePath: string;
  /** Filters to keep (everything except period and cursor). */
  preserve: QueryRecord;
  activeRange: "7d" | "30d" | "90d" | "custom";
  from?: string;
  to?: string;
  label?: string;
}) {
  const customActive = activeRange === "custom";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1.5 text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-muted">
        <CalendarDays className="size-3.5" strokeWidth={2} aria-hidden="true" />
        {label}
      </span>

      <div className="inline-flex rounded-[8px] border border-line bg-surface p-0.5" role="group" aria-label={label}>
        {presets.map((preset) => {
          const active = activeRange === preset.id;
          return (
            <Link
              key={preset.id}
              href={buildHref(basePath, { ...preserve, range: preset.id })}
              aria-current={active ? "true" : undefined}
              className={cn(
                "inline-flex h-7 items-center rounded-[6px] px-2.5 text-[0.71875rem] font-bold transition-colors",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet",
                active
                  ? "bg-white text-violet-ink shadow-[0_1px_2px_rgb(21_21_44_/_0.08)]"
                  : "text-muted hover:text-ink-soft",
              )}
            >
              {preset.label}
            </Link>
          );
        })}
      </div>

      <form
        action={basePath}
        method="get"
        className={cn(
          "flex flex-wrap items-end gap-1.5 rounded-[8px] border p-1",
          customActive ? "border-violet/30 bg-tint/60" : "border-line bg-white",
        )}
      >
        {Object.entries(preserve).map(([key, value]) =>
          value === undefined ? null : (
            <input key={key} type="hidden" name={key} value={String(value)} />
          ),
        )}
        <div>
          <label htmlFor="range-from" className="sr-only">
            From date
          </label>
          <input
            id="range-from"
            type="date"
            name="from"
            defaultValue={from}
            required
            className="h-7 rounded-[6px] border border-line-strong bg-white px-1.5 text-[0.71875rem] text-ink focus:border-violet focus-visible:outline-none"
          />
        </div>
        <span aria-hidden="true" className="pb-1 text-[0.75rem] text-muted">
          →
        </span>
        <div>
          <label htmlFor="range-to" className="sr-only">
            To date
          </label>
          <input
            id="range-to"
            type="date"
            name="to"
            defaultValue={to}
            required
            className="h-7 rounded-[6px] border border-line-strong bg-white px-1.5 text-[0.71875rem] text-ink focus:border-violet focus-visible:outline-none"
          />
        </div>
        <button
          type="submit"
          className="h-7 rounded-[6px] bg-white px-2 text-[0.71875rem] font-bold text-violet-ink shadow-[0_1px_2px_rgb(21_21_44_/_0.08)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet"
        >
          Apply
        </button>
      </form>
    </div>
  );
}
