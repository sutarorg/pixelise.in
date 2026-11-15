import { cn } from "@/lib/utils";

/**
 * Indeterminate progress.
 *
 * Pixelise does not know how far a provider is through a render, so this bar
 * never invents a percentage. `label` is what assistive technology hears; the
 * visible status text lives next to it in `GenerationStatus`.
 */
export function IndeterminateProgress({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuetext={label}
      className={cn(
        "relative h-1.5 w-full overflow-hidden rounded-full bg-violet-soft/70",
        className,
      )}
    >
      <span className="absolute inset-y-0 left-0 w-1/3 rounded-full bg-violet animate-[progress-slide_1.6s_ease-in-out_infinite]" />
    </div>
  );
}
