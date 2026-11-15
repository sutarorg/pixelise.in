import Link from "next/link";
import { Search, X } from "lucide-react";

import { buildHref, type QueryRecord } from "@/lib/admin-filters";

/**
 * Server-driven search: a real GET form, so it works without JavaScript, keeps
 * the query in the URL and never debounces into a request storm. Submitting
 * resets the cursor because the result set changes.
 */
export function SearchInput({
  basePath,
  name = "q",
  label,
  placeholder,
  defaultValue,
  preserve,
}: {
  basePath: string;
  name?: string;
  label: string;
  placeholder: string;
  defaultValue?: string;
  preserve: QueryRecord;
}) {
  const rest: QueryRecord = {};
  for (const [key, value] of Object.entries(preserve)) {
    if (key === "cursor" || key === name) continue;
    rest[key] = value;
  }

  return (
    <form action={basePath} method="get" role="search" className="min-w-0">
      {Object.entries(rest).map(([key, value]) =>
        value === undefined ? null : (
          <input key={key} type="hidden" name={key} value={String(value)} />
        ),
      )}
      <label htmlFor={`${name}-search`} className="sr-only">
        {label}
      </label>
      <div className="relative flex items-center">
        <Search
          className="pointer-events-none absolute left-2.5 size-3.5 text-muted"
          strokeWidth={2}
          aria-hidden="true"
        />
        <input
          id={`${name}-search`}
          type="search"
          name={name}
          defaultValue={defaultValue}
          placeholder={placeholder}
          autoComplete="off"
          className="h-8 w-full min-w-[11rem] rounded-[8px] border border-line-strong bg-white pl-8 pr-16 text-[0.8125rem] text-ink placeholder:text-muted/80 hover:border-ink/25 focus:border-violet focus:shadow-[0_0_0_3px_rgb(96_69_245_/_0.14)] focus-visible:outline-none sm:w-[16rem]"
        />
        <button
          type="submit"
          className="absolute right-1 inline-flex h-6 items-center rounded-[6px] bg-tint px-2 text-[0.6875rem] font-bold text-violet-ink hover:bg-tint-deep focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-violet"
        >
          Search
        </button>
      </div>
      {defaultValue ? (
        <Link
          href={buildHref(basePath, rest)}
          className="mt-1 inline-flex items-center gap-1 rounded text-[0.6875rem] font-semibold text-muted hover:text-ink-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet"
        >
          <X className="size-3" strokeWidth={2.4} aria-hidden="true" />
          Clear “{defaultValue}”
        </Link>
      ) : null}
    </form>
  );
}
