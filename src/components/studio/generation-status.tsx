"use client";

import { AlertTriangle, ImageUp, Loader2, RotateCw, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { IndeterminateProgress } from "@/components/ui/progress";
import { isBusy, jobStatusLabel, phaseLabel, type StudioPhase } from "@/components/studio/types";
import type { GenerationStatus as JobStatus } from "@/lib/api/types";

/**
 * The processing experience.
 *
 * There is no percentage because the provider does not report one: inventing a
 * number would be a lie that gets stuck at 97%. Instead the customer sees the
 * real step they are on, an indeterminate bar, and an honest promise about what
 * happens if they leave.
 */
export function GenerationStatus({
  phase,
  jobStatus,
  error,
  onRetry,
  onReset,
}: {
  phase: StudioPhase;
  jobStatus: JobStatus | null;
  error: string | null;
  onRetry: () => void;
  onReset: () => void;
}) {
  if (phase === "failed") {
    return (
      <div
        role="alert"
        className="mx-3 mb-3 rounded-[12px] border border-[#f3c9c4] bg-[#fdf1f0] p-3.5 text-[#7d2a22] sm:mx-4"
      >
        <p className="flex items-center gap-2 text-[0.8125rem] font-bold">
          <AlertTriangle className="size-4 shrink-0" strokeWidth={2} aria-hidden="true" />
          We couldn&apos;t start this generation
        </p>
        <p className="mt-1 text-[0.75rem] leading-[1.55]">
          {error ?? "The studio service didn't respond. Nothing was charged."}
        </p>
        <p className="mt-1 text-[0.6875rem] leading-[1.5] text-[#8c3a31]">
          If credits were reserved for this job, the studio releases them automatically.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="primary" onClick={onRetry}>
            <RotateCw className="size-3.5" aria-hidden="true" />
            Try again
          </Button>
          <Button type="button" size="sm" variant="secondary" onClick={onReset}>
            Start over
          </Button>
        </div>
      </div>
    );
  }

  if (!isBusy(phase)) return null;

  const stepIndex = phase === "uploading" ? 0 : phase === "preparing" ? 1 : 2;
  const steps = ["Upload", "Prepare", "Render"];

  return (
    <div
      role="status"
      aria-live="polite"
      className="mx-3 mb-3 rounded-[12px] border border-line bg-white/95 p-3.5 shadow-lift backdrop-blur sm:mx-4"
    >
      <div className="flex items-center gap-2.5">
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-tint">
          {phase === "uploading" ? (
            <ImageUp className="size-3.5 text-violet" strokeWidth={2} aria-hidden="true" />
          ) : (
            <Loader2 className="size-3.5 animate-spin text-violet" aria-hidden="true" />
          )}
        </span>
        <div className="min-w-0">
          <p className="text-[0.8125rem] font-bold text-ink">{phaseLabel[phase]}</p>
          <p className="text-[0.6875rem] text-muted">
            {jobStatus ? jobStatusLabel(jobStatus) : "Talking to the studio service"}
          </p>
        </div>
      </div>

      <IndeterminateProgress
        label={`${phaseLabel[phase]}. ${jobStatus ? jobStatusLabel(jobStatus) : "Working"}.`}
        className="mt-3"
      />

      <ol className="mt-3 flex items-center gap-1.5" aria-hidden="true">
        {steps.map((step, index) => (
          <li key={step} className="flex flex-1 items-center gap-1.5">
            <span
              className={`h-1 flex-1 rounded-full ${
                index <= stepIndex ? "bg-violet" : "bg-line"
              }`}
            />
            <span
              className={`text-[0.625rem] font-bold uppercase tracking-[0.1em] ${
                index <= stepIndex ? "text-violet-ink" : "text-muted"
              }`}
            >
              {step}
            </span>
          </li>
        ))}
      </ol>

      <p className="mt-3 flex items-start gap-1.5 text-[0.6875rem] leading-[1.5] text-muted">
        <ShieldCheck className="mt-px size-3.5 shrink-0 text-success" strokeWidth={2} aria-hidden="true" />
        You can leave this page — the render continues on our servers and your credits settle when
        it finishes.
      </p>
    </div>
  );
}
