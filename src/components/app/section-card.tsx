import { cn } from "@/lib/utils";

/**
 * A titled panel in the workspace: hairline border, one header row, a body.
 * Used instead of ad-hoc cards so every page shares the same rhythm.
 */
export function SectionCard({
  title,
  description,
  action,
  children,
  bodyClassName,
  className,
  headingId,
}: {
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  bodyClassName?: string;
  className?: string;
  headingId?: string;
}) {
  return (
    <section
      aria-labelledby={headingId}
      className={cn(
        "overflow-hidden rounded-[var(--radius-card)] border border-line bg-white shadow-card",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3.5 sm:px-5">
        <div className="min-w-0">
          <h2
            id={headingId}
            className="text-[0.9375rem] font-bold tracking-[-0.015em] text-ink"
          >
            {title}
          </h2>
          {description ? (
            <p className="mt-0.5 text-[0.75rem] leading-[1.5] text-muted">{description}</p>
          ) : null}
        </div>
        {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
      </div>
      <div className={cn("min-w-0", bodyClassName)}>{children}</div>
    </section>
  );
}

/** Small text link used in section headers. */
export function SectionLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="rounded text-[0.75rem] font-bold text-violet-ink underline decoration-violet/25 underline-offset-4 transition-colors hover:decoration-violet focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet"
    >
      {children}
    </a>
  );
}
