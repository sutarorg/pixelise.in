import Link from "next/link";

import { cn } from "@/lib/utils";
import { defaultStyles } from "@/config/studio";

function href(style: string, sort: "newest" | "oldest") {
  const params = new URLSearchParams();
  if (style !== "all") params.set("style", style);
  if (sort !== "newest") params.set("sort", sort);
  const query = params.toString();
  return query ? `/creations?${query}` : "/creations";
}

/**
 * Style and sort filters as real links: every combination is shareable,
 * back-button friendly and works without JavaScript.
 */
export function CreationsFilters({
  style,
  sort,
  count,
}: {
  style: string;
  sort: "newest" | "oldest";
  count: number;
}) {
  const styles = [{ id: "all", name: "All" }, ...defaultStyles.map((s) => ({ id: s.id, name: s.name }))];

  return (
    <div className="flex flex-col gap-3 rounded-[12px] border border-line bg-white px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter by style">
        {styles.map((option) => {
          const active = style === option.id;
          return (
            <Link
              key={option.id}
              href={href(option.id, sort)}
              aria-current={active ? "true" : undefined}
              className={cn(
                "inline-flex h-8 items-center rounded-full border px-3 text-[0.75rem] font-semibold transition-colors",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet",
                active
                  ? "border-violet/25 bg-violet/10 text-violet-ink"
                  : "border-line bg-white text-muted-strong hover:border-line-strong hover:text-ink",
              )}
            >
              {option.name}
            </Link>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <p className="text-[0.71875rem] text-muted" aria-live="polite">
          {count === 1 ? "1 visual" : `${count} visuals`}
        </p>
        <div
          className="inline-flex rounded-[8px] border border-line bg-surface p-0.5"
          role="group"
          aria-label="Sort by date"
        >
          {(
            [
              { id: "newest", label: "Newest" },
              { id: "oldest", label: "Oldest" },
            ] as const
          ).map((option) => (
            <Link
              key={option.id}
              href={href(style, option.id)}
              aria-current={sort === option.id ? "true" : undefined}
              className={cn(
                "inline-flex h-7 items-center rounded-[6px] px-2.5 text-[0.71875rem] font-bold transition-colors",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet",
                sort === option.id
                  ? "bg-white text-violet-ink shadow-[0_1px_2px_rgb(21_21_44_/_0.08)]"
                  : "text-muted hover:text-ink-soft",
              )}
            >
              {option.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
