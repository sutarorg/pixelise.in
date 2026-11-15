import { Skeleton } from "@/components/ui/skeleton";

/** First paint of the workspace frame, before the session resolves. */
export function ShellSkeleton() {
  return (
    <div className="min-h-dvh bg-surface lg:pl-[248px]">
      <div className="fixed inset-y-0 left-0 hidden w-[248px] flex-col border-r border-line bg-white lg:flex">
        <div className="flex h-16 items-center border-b border-line px-5">
          <Skeleton className="h-6 w-28" />
        </div>
        <div className="space-y-2 px-4 py-6">
          {Array.from({ length: 7 }).map((_, index) => (
            <Skeleton key={index} className="h-9 w-full" />
          ))}
        </div>
      </div>
      <div className="flex min-h-dvh flex-col">
        <div className="flex h-16 items-center justify-between border-b border-line px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-9 w-40 rounded-full" />
        </div>
        <div className="mx-auto w-full max-w-[78rem] space-y-5 px-4 py-6 sm:px-6 lg:px-8">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-40 w-full rounded-[var(--radius-card)]" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
