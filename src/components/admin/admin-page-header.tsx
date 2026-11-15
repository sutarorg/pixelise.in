import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Title block for a console page: one heading, one line of scope, actions on the
 * right. Actions are page-specific, so each page supplies them; the persistent
 * trail lives in the header above.
 */
export function AdminPageHeader({
  title,
  description,
  actions,
  back,
  meta,
  className,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  back?: { href: string; label: string };
  meta?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-b border-line pb-4 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        {back ? (
          <Link
            href={back.href}
            className="mb-1.5 inline-flex items-center gap-1 rounded text-[0.75rem] font-semibold text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet"
          >
            <ChevronLeft className="size-3.5" strokeWidth={2.2} aria-hidden="true" />
            {back.label}
          </Link>
        ) : null}
        <h1 className="text-[1.25rem] font-extrabold leading-[1.2] tracking-[-0.03em] text-ink sm:text-[1.375rem]">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 max-w-[68ch] text-[0.8125rem] leading-[1.6] text-muted-strong">
            {description}
          </p>
        ) : null}
        {meta ? <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5">{meta}</div> : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
