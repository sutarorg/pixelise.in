import { cn } from "@/lib/utils";

/**
 * A numbered step in the studio's configure column. The number is decorative —
 * the heading carries the meaning — and every step is a real fieldset in the
 * components that use it.
 */
export function StepPanel({
  step,
  title,
  hint,
  action,
  children,
  className,
}: {
  step: number;
  title: string;
  hint?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-[14px] border border-line bg-white p-3.5 shadow-card sm:p-4",
        className,
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="grid size-5 place-items-center rounded-full bg-tint text-[0.6875rem] font-bold text-violet-ink"
          >
            {step}
          </span>
          <h2 className="text-[0.875rem] font-bold tracking-[-0.015em] text-ink">{title}</h2>
        </div>
        {action}
      </div>
      {hint ? <p className="-mt-1.5 mb-3 text-[0.75rem] leading-[1.5] text-muted">{hint}</p> : null}
      {children}
    </section>
  );
}
