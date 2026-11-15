import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Suspense fallbacks. Shapes only — no numbers, no placeholder names, so a slow
 * request never looks like a real record for a moment.
 */
export function ConsoleShellSkeleton() {
  return (
    <div className="min-h-dvh bg-surface">
      <div className="fixed inset-y-0 left-0 hidden w-[236px] border-r border-line bg-white lg:block">
        <div className="flex h-14 items-center border-b border-line px-4">
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="space-y-2 px-3 py-5">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-7 w-full" />
          ))}
        </div>
      </div>
      <div className="lg:pl-[236px]">
        <div className="flex h-14 items-center justify-between border-b border-line bg-white px-5">
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
        <div className="mx-auto w-full max-w-[86rem] space-y-4 px-4 py-5 sm:px-6">
          <Skeleton className="h-6 w-48" />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-[6.5rem] w-full" />
            ))}
          </div>
          <Skeleton className="h-[22rem] w-full" />
        </div>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 8, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("divide-y divide-line", className)} aria-hidden="true">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-4 px-4 py-3">
          <Skeleton className="h-3.5 w-1/4" />
          <Skeleton className="h-3.5 w-1/5" />
          <Skeleton className="h-3.5 w-1/6" />
          <Skeleton className="ml-auto h-4 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function OverviewSkeleton() {
  return (
    <div className="space-y-4" aria-hidden="true">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} className="h-[6.25rem] w-full" />
        ))}
      </div>
      <Skeleton className="h-[16rem] w-full" />
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="space-y-4 p-4" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex items-center justify-between gap-6">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      ))}
    </div>
  );
}
