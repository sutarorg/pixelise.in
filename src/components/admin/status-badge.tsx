import { cn } from "@/lib/utils";
import type { StatusTone } from "@/config/admin";

const tones: Record<StatusTone, { wrapper: string; dot: string }> = {
  success: { wrapper: "bg-[#eefaf3] text-[#0d6b46]", dot: "bg-success" },
  warning: { wrapper: "bg-[#fdf6e7] text-[#7d5a12]", dot: "bg-[#c99416]" },
  danger: { wrapper: "bg-[#fdf1f0] text-[#7d2a22]", dot: "bg-[#c4342a]" },
  neutral: { wrapper: "bg-surface text-muted-strong", dot: "bg-muted" },
  info: { wrapper: "bg-tint text-violet-ink", dot: "bg-violet" },
  violet: { wrapper: "bg-violet/10 text-violet-ink", dot: "bg-violet" },
};

/**
 * A status is always a word first and a colour second, so the meaning survives
 * colour blindness, greyscale printing and screen readers.
 */
export function StatusBadge({
  tone,
  children,
  dot = true,
  className,
}: {
  tone: StatusTone;
  children: React.ReactNode;
  dot?: boolean;
  className?: string;
}) {
  const t = tones[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[0.6875rem] font-bold",
        t.wrapper,
        className,
      )}
    >
      {dot ? (
        <span aria-hidden="true" className={cn("size-1.5 rounded-full", t.dot)} />
      ) : null}
      {children}
    </span>
  );
}
