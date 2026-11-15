import { cn } from "@/lib/utils";

/**
 * Loading placeholder. The global reduced-motion rule collapses the pulse to a
 * single static frame, so this stays comfortable for motion-sensitive users.
 */
export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn("animate-pulse rounded-[10px] bg-line/70", className)}
      {...props}
    />
  );
}

/** Multi-line text placeholder with a natural ragged last line. */
export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2.5", className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className={cn("h-3.5", index === lines - 1 ? "w-2/3" : "w-full")}
        />
      ))}
    </div>
  );
}
