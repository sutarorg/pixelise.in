import { cn } from "@/lib/utils";

/**
 * One operational number.
 *
 * `value` is always a string the server produced (or "—"). When the backend
 * cannot compute a metric it returns null and the card says "Not available" —
 * a zero would be a different, false statement.
 */
export function MetricCard({
  label,
  value,
  hint,
  footnote,
  unavailable = false,
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  footnote?: string;
  unavailable?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col justify-between rounded-[12px] border border-line bg-white p-3.5 shadow-card",
        className,
      )}
    >
      <div>
        <p className="text-[0.65625rem] font-bold uppercase tracking-[0.14em] text-muted">
          {label}
        </p>
        <p
          className={cn(
            "mt-2 text-[1.5rem] font-extrabold leading-none tracking-[-0.035em] tabular-nums",
            unavailable ? "text-muted" : "text-ink",
          )}
        >
          {value}
        </p>
        {hint ? <p className="mt-1.5 text-[0.75rem] leading-[1.5] text-muted-strong">{hint}</p> : null}
      </div>
      {footnote ? (
        <p className="mt-2.5 border-t border-line/70 pt-2 text-[0.65625rem] leading-[1.5] text-muted">
          {footnote}
        </p>
      ) : null}
    </div>
  );
}
