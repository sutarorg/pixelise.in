"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  ArrowRight,
  Columns2,
  Download,
  Images,
  ImagePlus,
  Maximize2,
  Sparkles,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/app/state-views";
import { GenerationStatus } from "@/components/studio/generation-status";
import { isBusy, phaseLabel, type StudioPhase } from "@/components/studio/types";
import { formatCredits, formatDate } from "@/lib/format";
import type {
  AspectRatioOption,
  Generation,
  GenerationStatus as JobStatus,
} from "@/lib/api/types";
import type { SelectedPhoto } from "@/components/studio/image-uploader";

type ViewMode = "result" | "source" | "compare";

/**
 * The right-hand canvas: source photo, progress, result, comparison and zoom.
 *
 * Nothing here is a fabricated result. Until the service returns a completed
 * generation with a URL, the frame shows the customer's own photo and an honest
 * status.
 */
export function GenerationPreview({
  phase,
  jobStatus,
  photo,
  generation,
  error,
  aspect,
  onRetry,
  onReset,
  onBrowse,
}: {
  phase: StudioPhase;
  jobStatus: JobStatus | null;
  photo: SelectedPhoto | null;
  generation: Generation | null;
  error: string | null;
  aspect: AspectRatioOption | null;
  onRetry: () => void;
  onReset: () => void;
  onBrowse: () => void;
}) {
  const [zoomOpen, setZoomOpen] = React.useState(false);
  /*
   * The preview mode is scoped to one generation: when a new visual arrives the
   * mode silently falls back to "result" because the stored id no longer
   * matches. Deriving beats resetting in an effect.
   */
  const [viewState, setViewState] = React.useState<{ id: string | undefined; view: ViewMode }>({
    id: undefined,
    view: "result",
  });
  const view: ViewMode = viewState.id === generation?.id ? viewState.view : "result";
  const setView = React.useCallback(
    (next: ViewMode) => setViewState({ id: generation?.id, view: next }),
    [generation?.id],
  );

  const resultUrl = generation?.resultUrl ?? null;
  const sourceUrl = generation?.sourceUrl ?? photo?.previewUrl ?? null;
  const completed = phase === "completed" && Boolean(resultUrl);
  const ratio = aspect ? `${aspect.width} / ${aspect.height}` : "1 / 1";
  const canCompare = completed && Boolean(sourceUrl);

  return (
    <div className="flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-white shadow-card xl:sticky xl:top-[5.25rem]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-3.5 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <Images className="size-4 shrink-0 text-muted" strokeWidth={1.9} aria-hidden="true" />
          <p className="truncate text-[0.8125rem] font-bold text-ink">Canvas</p>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[0.65625rem] font-bold uppercase tracking-[0.08em]",
              phase === "completed"
                ? "bg-[#eefaf3] text-[#0d6b46]"
                : phase === "failed"
                  ? "bg-[#fdf1f0] text-[#7d2a22]"
                  : isBusy(phase)
                    ? "bg-tint text-violet-ink"
                    : "bg-surface text-muted-strong",
            )}
          >
            {phaseLabel[phase]}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {canCompare ? (
            <div
              role="group"
              aria-label="Preview mode"
              className="inline-flex rounded-[8px] border border-line bg-surface p-0.5"
            >
              {(
                [
                  { id: "result", label: "Result" },
                  { id: "source", label: "Source" },
                  { id: "compare", label: "Compare" },
                ] as { id: ViewMode; label: string }[]
              ).map((option) => (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={view === option.id}
                  onClick={() => setView(option.id)}
                  className={cn(
                    "inline-flex h-7 items-center gap-1 rounded-[6px] px-2 text-[0.6875rem] font-bold transition-colors",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet",
                    view === option.id
                      ? "bg-white text-violet-ink shadow-[0_1px_2px_rgb(21_21_44_/_0.08)]"
                      : "text-muted hover:text-ink-soft",
                  )}
                >
                  {option.id === "compare" ? (
                    <Columns2 className="size-3" strokeWidth={2.2} aria-hidden="true" />
                  ) : null}
                  {option.label}
                </button>
              ))}
            </div>
          ) : null}

          {completed && resultUrl ? (
            <>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setZoomOpen(true)}
                aria-label="Zoom the generated visual"
                className="px-2"
              >
                <Maximize2 className="size-4" aria-hidden="true" />
              </Button>
              <Button asChild size="sm">
                <a
                  href={resultUrl}
                  download={`pixelise-${generation?.id ?? "visual"}.jpg`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download className="size-3.5" aria-hidden="true" />
                  Download
                </a>
              </Button>
            </>
          ) : null}
        </div>
      </div>

      <div className="flex-1 bg-[#f7f6fb] p-3 sm:p-4">
        {!photo && !completed ? (
          <div className="rounded-[12px] border border-dashed border-line-strong bg-white/70">
            <EmptyState
              icon={ImagePlus}
              title="Add a product photo to begin"
              description="Drag a photo into the upload panel, or browse your files. Straight-on shots with even light give the studio the most to work with."
              action={
                <Button type="button" size="sm" variant="secondary" onClick={onBrowse}>
                  Browse files
                </Button>
              }
            />
          </div>
        ) : view === "compare" && canCompare ? (
          <div className="grid gap-2 sm:grid-cols-2">
            <figure>
              <figcaption className="mb-1.5 text-[0.65625rem] font-bold uppercase tracking-[0.12em] text-muted">
                Your photo
              </figcaption>
              <div
                className="overflow-hidden rounded-[10px] border border-line bg-white"
                style={{ aspectRatio: ratio }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={sourceUrl ?? ""}
                  alt="The product photo you uploaded"
                  className="size-full object-contain"
                />
              </div>
            </figure>
            <figure>
              <figcaption className="mb-1.5 flex items-center gap-1.5 text-[0.65625rem] font-bold uppercase tracking-[0.12em] text-violet-ink">
                <Sparkles className="size-3" strokeWidth={2.4} aria-hidden="true" />
                Pixelise visual
              </figcaption>
              <div
                className="overflow-hidden rounded-[10px] border border-violet/25 bg-white"
                style={{ aspectRatio: ratio }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resultUrl ?? ""}
                  alt={`${generation?.styleName ?? "Generated"} visual`}
                  className="size-full object-cover"
                />
              </div>
            </figure>
          </div>
        ) : (
          <div className="relative mx-auto w-full max-w-[38rem]">
            <div
              className={cn(
                "relative mx-auto overflow-hidden rounded-[10px] border bg-white",
                view === "result" && completed ? "border-violet/25" : "border-line",
              )}
              style={{ aspectRatio: ratio, maxHeight: "min(62vh, 34rem)" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={(view === "result" && completed ? resultUrl : sourceUrl) ?? ""}
                alt={
                  view === "result" && completed
                    ? `${generation?.styleName ?? "Generated"} visual of your product`
                    : "The product photo you uploaded"
                }
                className={cn(
                  "size-full",
                  view === "result" && completed ? "object-cover" : "object-contain",
                )}
              />

              {isBusy(phase) ? (
                <div className="absolute inset-0 grid place-items-center bg-white/45 backdrop-blur-[1px]">
                  <div className="flex items-center gap-2 rounded-full border border-line bg-white/95 px-3 py-1.5 text-[0.6875rem] font-bold text-ink shadow-card">
                    <span className="size-1.5 animate-pulse rounded-full bg-violet" />
                    {phaseLabel[phase]}…
                  </div>
                </div>
              ) : null}

              {!completed && !isBusy(phase) && photo ? (
                <span className="absolute bottom-2 left-2 rounded-full bg-white/92 px-2 py-0.5 text-[0.65625rem] font-semibold text-muted-strong backdrop-blur-sm">
                  Source · {photo.width}×{photo.height}
                </span>
              ) : null}
            </div>
          </div>
        )}
      </div>

      <GenerationStatus
        phase={phase}
        jobStatus={jobStatus}
        error={error}
        onRetry={onRetry}
        onReset={onReset}
      />

      {completed && generation ? (
        <>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-line px-4 py-3 text-[0.71875rem] sm:grid-cols-4">
            <div>
              <dt className="text-muted">Style</dt>
              <dd className="mt-0.5 font-bold text-ink">{generation.styleName}</dd>
            </div>
            <div>
              <dt className="text-muted">Scene</dt>
              <dd className="mt-0.5 truncate font-bold text-ink">
                {generation.sceneName ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Size</dt>
              <dd className="mt-0.5 font-bold tabular-nums text-ink">
                {generation.width && generation.height
                  ? `${generation.width}×${generation.height}`
                  : generation.aspectRatio}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Credits</dt>
              <dd className="mt-0.5 font-bold tabular-nums text-ink">
                {generation.creditsCharged !== null
                  ? formatCredits(generation.creditsCharged)
                  : generation.creditsReserved !== null
                    ? `${formatCredits(generation.creditsReserved)} reserved`
                    : "—"}
              </dd>
            </div>
          </dl>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-3">
            <p className="text-[0.6875rem] text-muted">
              Created {formatDate(generation.completedAt ?? generation.createdAt)}
            </p>
            <Button type="button" size="sm" variant="secondary" onClick={onReset}>
              Create another
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Button>
          </div>
        </>
      ) : null}

      {resultUrl ? <ZoomDialog open={zoomOpen} onOpenChange={setZoomOpen} url={resultUrl} generation={generation} /> : null}
    </div>
  );
}

function ZoomDialog({
  open,
  onOpenChange,
  url,
  generation,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
  generation: Generation | null;
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-ink/70 backdrop-blur-sm data-[state=open]:animate-overlay-in" />
        <DialogPrimitive.Content className="fixed inset-0 z-50 flex flex-col p-3 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="rounded-[10px] bg-ink/60 px-3 py-2 text-white backdrop-blur">
              <DialogPrimitive.Title className="text-[0.8125rem] font-bold">
                {generation?.styleName ?? "Generated"} visual
                {generation?.sceneName ? ` · ${generation.sceneName}` : ""}
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="mt-0.5 text-[0.6875rem] text-white/70">
                {generation?.width && generation.height
                  ? `${generation.width}×${generation.height}px`
                  : "Full size"}
              </DialogPrimitive.Description>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild size="sm" variant="inverse">
                <a
                  href={url}
                  download={`pixelise-${generation?.id ?? "visual"}.jpg`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download className="size-3.5" aria-hidden="true" />
                  Download
                </a>
              </Button>
              <DialogPrimitive.Close asChild>
                <Button type="button" size="sm" variant="inverseOutline" aria-label="Close preview">
                  <X className="size-4" aria-hidden="true" />
                  Close
                </Button>
              </DialogPrimitive.Close>
            </div>
          </div>
          <div className="mt-3 flex min-h-0 flex-1 items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={generation ? `${generation.styleName} visual of your product` : "Generated visual"}
              className="max-h-full max-w-full rounded-[10px] object-contain shadow-float"
            />
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
