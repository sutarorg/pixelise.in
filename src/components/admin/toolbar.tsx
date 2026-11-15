import { cn } from "@/lib/utils";

/**
 * One horizontal strip for filters, above the table it controls. Filters are
 * server-driven links and GET forms, so this strip holds no state.
 */
export function ConsoleToolbar({
  children,
  className,
  actions,
}: {
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-end justify-between gap-x-4 gap-y-3 rounded-[10px] border border-line bg-white px-3 py-2.5",
        className,
      )}
    >
      <div className="flex min-w-0 flex-wrap items-end gap-x-4 gap-y-3">{children}</div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
