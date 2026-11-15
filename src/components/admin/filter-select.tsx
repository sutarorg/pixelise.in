import { ChevronDown } from "lucide-react";

import { buildHref, type QueryRecord } from "@/lib/admin-filters";

/**
 * One server-side filter. A GET form with an explicit Apply button: no hidden
 * auto-submit, so it works without JavaScript, announces nothing unexpectedly,
 * and resets the cursor because the result set changes.
 */
export function FilterSelect({
  basePath,
  name,
  label,
  value,
  options,
  preserve,
  allLabel = "All",
}: {
  basePath: string;
  name: string;
  label: string;
  value?: string;
  options: { value: string; label: string }[];
  preserve: QueryRecord;
  allLabel?: string;
}) {
  const rest: QueryRecord = {};
  for (const [key, option] of Object.entries(preserve)) {
    if (key === "cursor" || key === name) continue;
    rest[key] = option;
  }
  const id = `filter-${name}`;

  return (
    <form action={basePath} method="get" className="flex items-end gap-1.5">
      {Object.entries(rest).map(([key, option]) =>
        option === undefined ? null : (
          <input key={key} type="hidden" name={key} value={String(option)} />
        ),
      )}
      <div>
        <label
          htmlFor={id}
          className="block text-[0.65625rem] font-bold uppercase tracking-[0.1em] text-muted"
        >
          {label}
        </label>
        <div className="relative mt-1">
          <select
            id={id}
            name={name}
            defaultValue={value ?? ""}
            className="h-8 w-full appearance-none rounded-[8px] border border-line-strong bg-white pl-2.5 pr-7 text-[0.78125rem] font-medium text-ink hover:border-ink/25 focus:border-violet focus-visible:outline-none"
          >
            <option value="">{allLabel}</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-muted"
            strokeWidth={2.2}
            aria-hidden="true"
          />
        </div>
      </div>
      <button
        type="submit"
        className="h-8 rounded-[8px] border border-line-strong bg-white px-2.5 text-[0.71875rem] font-bold text-ink-soft hover:border-ink/25 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet"
      >
        Apply
      </button>
    </form>
  );
}

/** Clears every filter except the period, keeping the page usable after a bad query. */
export function ClearFilters({ basePath, href }: { basePath: string; href?: string }) {
  const target = href ?? buildHref(basePath, {});
  return (
    <a
      href={target}
      className="inline-flex h-8 items-center rounded-[8px] px-2 text-[0.71875rem] font-semibold text-muted underline decoration-line-strong underline-offset-2 hover:text-ink-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet"
    >
      Reset filters
    </a>
  );
}
