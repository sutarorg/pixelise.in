import { cn } from "@/lib/utils";

/**
 * The frame every auth page shares: one card, one heading, one sentence of
 * context. Deliberately plainer than the marketing pages — this is a doorway,
 * not a sales page — and it holds a single H1 so the pages stay scannable by
 * assistive tech.
 */
export function AuthCard({
  title,
  description,
  children,
  footer,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  return (
    <section aria-labelledby="auth-title" className={cn("w-full max-w-[27rem]", className)}>
      <div className="rounded-[var(--radius-card)] border border-line bg-white p-6 shadow-card sm:p-8">
        <h1
          id="auth-title"
          className="text-[1.375rem] font-bold leading-[1.25] tracking-[-0.025em] text-ink sm:text-[1.5rem]"
        >
          {title}
        </h1>
        {description ? (
          <p className="mt-2 text-[0.875rem] leading-[1.6] text-muted">{description}</p>
        ) : null}
        <div className="mt-6">{children}</div>
      </div>
      {footer ? (
        <div className="mt-5 text-center text-[0.8125rem] leading-[1.6] text-muted">{footer}</div>
      ) : null}
    </section>
  );
}

/** Same footprint as the card, so the Suspense fallback does not shift layout. */
export function AuthCardSkeleton() {
  return (
    <div className="w-full max-w-[27rem]" aria-hidden="true">
      <div className="rounded-[var(--radius-card)] border border-line bg-white p-6 shadow-card sm:p-8">
        <div className="h-6 w-2/3 animate-pulse rounded bg-line" />
        <div className="mt-3 h-4 w-full animate-pulse rounded bg-line" />
        <div className="mt-7 space-y-5">
          <div className="h-12 animate-pulse rounded-[10px] bg-surface" />
          <div className="h-12 animate-pulse rounded-[10px] bg-surface" />
          <div className="h-11 w-full animate-pulse rounded-[10px] bg-tint" />
        </div>
      </div>
    </div>
  );
}
