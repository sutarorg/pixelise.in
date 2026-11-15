import { cn } from "@/lib/utils";

/**
 * Label/value pairs used by detail pages and drawers. A `<dl>` per group keeps
 * the relationship explicit for screen readers; values may be interactive.
 */
export function DetailSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("border-b border-line px-4 py-4 last:border-0 sm:px-5", className)}>
      <h3 className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-muted">
        {title}
      </h3>
      {description ? (
        <p className="mt-1 text-[0.75rem] leading-[1.5] text-muted">{description}</p>
      ) : null}
      <dl className="mt-2.5 grid gap-x-6 gap-y-2.5 sm:grid-cols-2">{children}</dl>
    </section>
  );
}

export function DetailItem({
  label,
  children,
  wide = false,
  mono = false,
}: {
  label: string;
  children: React.ReactNode;
  wide?: boolean;
  mono?: boolean;
}) {
  return (
    <div className={cn("min-w-0", wide && "sm:col-span-2")}>
      <dt className="text-[0.6875rem] font-semibold text-muted">{label}</dt>
      <dd
        className={cn(
          "mt-0.5 break-words text-[0.8125rem] text-ink-soft",
          mono && "font-mono text-[0.75rem]",
        )}
      >
        {children}
      </dd>
    </div>
  );
}

/** `null` is "the backend did not provide this" — never a zero, never a dash alone. */
export function Unknown() {
  return (
    <span className="text-muted">
      Not available
      <span className="sr-only"> from the API</span>
    </span>
  );
}

/** Long opaque identifiers: monospace, copyable, wrapped at small widths. */
export function Identifier({ value }: { value: string | null }) {
  if (!value) return <Unknown />;
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-[5px] bg-surface px-1.5 py-0.5 font-mono text-[0.71875rem] text-ink-soft">
      <span className="break-all">{value}</span>
    </span>
  );
}
