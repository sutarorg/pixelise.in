import Link from "next/link";
import { Download, Loader2, TriangleAlert } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import type { Generation } from "@/lib/api/types";

const statusLabel: Record<Generation["status"], string> = {
  queued: "Queued",
  preparing: "Preparing",
  rendering: "Rendering",
  completed: "Ready",
  failed: "Failed",
  cancelled: "Cancelled",
};

function imageUrl(generation: Generation): string | null {
  return generation.thumbnailUrl ?? generation.resultUrl;
}

/**
 * One generated visual in a grid.
 *
 * Images come from the API as absolute URLs (R2 public or signed), so they are
 * rendered with a plain `<img>` at a fixed aspect ratio: no layout shift, lazy
 * decoding, and no optimiser rewriting a signed URL. Card actions sit outside
 * the link so no interactive element is nested inside another.
 */
export function GenerationCard({
  generation,
  priority = false,
  actions,
}: {
  generation: Generation;
  priority?: boolean;
  actions?: React.ReactNode;
}) {
  const src = imageUrl(generation);
  const pending =
    generation.status === "queued" ||
    generation.status === "preparing" ||
    generation.status === "rendering";
  const failed = generation.status === "failed" || generation.status === "cancelled";

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-[14px] border border-line bg-white",
        "transition-[border-color,box-shadow,transform] duration-200",
        "hover:-translate-y-0.5 hover:border-line-strong hover:shadow-card",
      )}
    >
      <Link
        href={`/creations/${generation.id}`}
        className="block focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-violet"
      >
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-surface">
          {src ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={src}
              alt={`${generation.styleName} visual${generation.sceneName ? ` — ${generation.sceneName}` : ""}`}
              loading={priority ? "eager" : "lazy"}
              decoding="async"
              className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.015]"
            />
          ) : (
            <div className="grid size-full place-items-center bg-[linear-gradient(135deg,#f6f3ff_0%,#faf9ff_60%,#f1ecff_100%)]">
              {failed ? (
                <TriangleAlert className="size-6 text-[#c4342a]" strokeWidth={1.8} aria-hidden="true" />
              ) : (
                <Loader2 className="size-5 animate-spin text-violet" strokeWidth={2} aria-hidden="true" />
              )}
            </div>
          )}

          <span className="absolute left-2 top-2 rounded-full bg-white/92 px-2 py-0.5 text-[0.65625rem] font-bold uppercase tracking-[0.08em] text-ink-soft backdrop-blur-sm">
            {generation.styleName}
          </span>

          {generation.status !== "completed" ? (
            <span
              className={cn(
                "absolute right-2 top-2 rounded-full px-2 py-0.5 text-[0.65625rem] font-bold uppercase tracking-[0.08em]",
                failed ? "bg-[#fdf1f0] text-[#7d2a22]" : "bg-white/92 text-violet-ink backdrop-blur-sm",
              )}
            >
              {statusLabel[generation.status]}
            </span>
          ) : null}

          {pending ? (
            <span className="sr-only">{statusLabel[generation.status]}</span>
          ) : null}
        </div>
      </Link>

      <div className="flex items-start justify-between gap-1.5 px-2.5 py-2.5">
        <Link
          href={`/creations/${generation.id}`}
          className="min-w-0 flex-1 rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet"
        >
          <p className="truncate text-[0.8125rem] font-semibold text-ink">
            {generation.sceneName ?? generation.styleName}
          </p>
          <p className="mt-0.5 truncate text-[0.71875rem] text-muted">
            {formatDate(generation.createdAt)}
            {generation.creditsCharged !== null && generation.status === "completed"
              ? ` · ${generation.creditsCharged} credits`
              : ""}
          </p>
        </Link>

        <div className="flex shrink-0 items-center">
          {generation.status === "completed" && generation.resultUrl ? (
            <a
              href={generation.resultUrl}
              download={`pixelise-${generation.id}.jpg`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Download ${generation.styleName} visual from ${formatDate(generation.createdAt)}`}
              className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-tint hover:text-violet-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet"
            >
              <Download className="size-3.5" strokeWidth={2} aria-hidden="true" />
            </a>
          ) : null}
          {actions}
        </div>
      </div>
    </article>
  );
}

export function GenerationCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[14px] border border-line bg-white">
      <div className="aspect-[4/5] w-full animate-pulse bg-line/60" />
      <div className="space-y-2 px-3 py-3">
        <div className="h-3 w-2/3 animate-pulse rounded bg-line/60" />
        <div className="h-2.5 w-1/2 animate-pulse rounded bg-line/50" />
      </div>
    </div>
  );
}
