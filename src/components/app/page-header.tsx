import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * The current page, at the top of the workspace. Deliberately restrained: one
 * line of context, one heading, actions on the right. The dashboard has a
 * separate welcome treatment because it is the only page that greets someone.
 */
export function PageHeader({
  title,
  description,
  actions,
  back,
  className,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  back?: { href: string; label: string };
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between", className)}>
      <div className="min-w-0">
        {back ? (
          <Link
            href={back.href}
            className="mb-2.5 inline-flex items-center gap-1.5 rounded text-[0.75rem] font-semibold text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet"
          >
            <ChevronLeft className="size-3.5" strokeWidth={2.2} aria-hidden="true" />
            {back.label}
          </Link>
        ) : null}
        <h1 className="text-[1.375rem] font-extrabold leading-[1.2] tracking-[-0.03em] text-ink sm:text-[1.5rem]">
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 max-w-[60ch] text-[0.875rem] leading-[1.6] text-muted-strong">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
