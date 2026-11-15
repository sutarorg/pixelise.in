import { Inbox } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Empty region inside the console.
 *
 * Two different statements are possible and they are never mixed up:
 * "this filter matched nothing" (the data may exist under another filter) and
 * "the service returned zero records" (there genuinely are none yet). The caller
 * picks the wording; nothing here invents a record to fill the space.
 */
export function AdminEmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
  className,
  compact = false,
}: {
  title: string;
  description: React.ReactNode;
  icon?: LucideIcon;
  action?: React.ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-5 text-center",
        compact ? "py-8" : "py-12",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="grid size-9 place-items-center rounded-[9px] border border-line bg-surface text-muted-strong"
      >
        <Icon className="size-4" strokeWidth={1.9} />
      </span>
      <p className="mt-3 text-[0.875rem] font-bold tracking-[-0.01em] text-ink">{title}</p>
      <div className="mt-1 max-w-[52ch] text-[0.78125rem] leading-[1.6] text-muted">
        {description}
      </div>
      {action ? <div className="mt-3.5 flex flex-wrap items-center gap-2">{action}</div> : null}
    </div>
  );
}
