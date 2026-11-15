import Link from "next/link";
import {
  CheckCircle2,
  CloudOff,
  ImageIcon,
  Lock,
  ReceiptText,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { RetryButton } from "@/components/app/retry-button";
import type { ApiError } from "@/lib/api/types";

/* -------------------------------- Empty state ------------------------------ */

type EmptyStateTone = "neutral" | "violet";

export function EmptyState({
  icon: Icon = ImageIcon,
  title,
  description,
  action,
  secondaryAction,
  tone = "violet",
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description: React.ReactNode;
  action?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  tone?: EmptyStateTone;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-5 py-12 text-center sm:px-8 sm:py-16",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "grid size-12 place-items-center rounded-[14px] border",
          tone === "violet"
            ? "border-violet/15 bg-tint text-violet-ink"
            : "border-line bg-surface text-muted-strong",
        )}
      >
        <Icon className="size-[1.35rem]" strokeWidth={1.8} />
      </span>
      <h3 className="mt-4 text-[1.0625rem] font-bold tracking-[-0.02em] text-ink">{title}</h3>
      <p className="mt-1.5 max-w-[38ch] text-[0.875rem] leading-[1.65] text-muted-strong">
        {description}
      </p>
      {action || secondaryAction ? (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {action}
          {secondaryAction}
        </div>
      ) : null}
    </div>
  );
}

/** Empty gallery, used by the dashboard and My Creations. */
export function EmptyCreations({ context = "page" }: { context?: "page" | "dashboard" }) {
  return (
    <EmptyState
      icon={Sparkles}
      title={context === "dashboard" ? "Your creative workspace is ready." : "No creations yet"}
      description={
        context === "dashboard"
          ? "Upload your first product photo and start creating professional visuals."
          : "Every visual you generate is kept here with its style, scene and source photo."
      }
      action={
        <Button asChild size="sm">
          <Link href="/studio">
            <Sparkles className="size-4" aria-hidden="true" />
            Open AI Studio
          </Link>
        </Button>
      }
    />
  );
}

/* -------------------------------- Error state ------------------------------ */

export function ErrorState({
  error,
  title,
  description,
  action,
  onRetry = true,
  className,
}: {
  error: ApiError;
  title?: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  onRetry?: boolean;
  className?: string;
}) {
  const offline = error.code === "service_unavailable" || error.code === "network_error";
  const notConfigured = error.code === "not_configured";

  const heading =
    title ??
    (notConfigured
      ? "This workspace isn't connected yet"
      : offline
        ? "We can't reach the Pixelise service"
        : "Something went wrong");

  return (
    <div className={cn("px-5 py-10 sm:px-8 sm:py-12", className)}>
      <div className="mx-auto max-w-[46ch] text-center">
        <span
          aria-hidden="true"
          className="mx-auto grid size-12 place-items-center rounded-[14px] border border-line bg-surface text-muted-strong"
        >
          <CloudOff className="size-[1.35rem]" strokeWidth={1.8} />
        </span>
        <h3 className="mt-4 text-[1.0625rem] font-bold tracking-[-0.02em] text-ink">{heading}</h3>
        <p className="mt-1.5 text-[0.875rem] leading-[1.65] text-muted-strong">
          {description ??
            (notConfigured
              ? "Live account data appears here once the Pixelise API is connected. Nothing is simulated in the meantime."
              : offline
                ? "Your account and credits are safe. Nothing was changed by this request."
                : error.message)}
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {onRetry && error.retryable ? <RetryButton /> : null}
          {action}
        </div>
        <details className="mt-6 text-left">
          <summary className="mx-auto w-fit cursor-pointer list-none text-[0.75rem] font-semibold text-muted underline decoration-line-strong underline-offset-4 hover:text-ink-soft">
            Technical details
          </summary>
          <dl className="mt-2.5 grid gap-1 rounded-[10px] border border-line bg-surface px-3 py-2.5 text-[0.75rem] text-muted-strong">
            <div className="flex justify-between gap-4">
              <dt>Error</dt>
              <dd className="font-mono text-ink-soft">{error.code}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Status</dt>
              <dd className="font-mono text-ink-soft">{error.status || "no response"}</dd>
            </div>
            {error.requestId ? (
              <div className="flex justify-between gap-4">
                <dt>Request</dt>
                <dd className="font-mono text-ink-soft">{error.requestId}</dd>
              </div>
            ) : null}
          </dl>
        </details>
      </div>
    </div>
  );
}

/* --------------------------- Inline region notices ------------------------- */

/**
 * A failure inside one region of an otherwise working page (a chart, a list).
 * Keep it small: the page around it still works.
 */
export function RegionError({
  error,
  label = "This section couldn't load",
  className,
}: {
  error: ApiError;
  label?: string;
  className?: string;
}) {
  return (
    <Alert
      tone="offline"
      title={label}
      className={cn("mx-1", className)}
      action={error.retryable ? <RetryButton label="Reload" /> : undefined}
    >
      {error.code === "not_configured"
        ? "It fills in as soon as this workspace is connected to the Pixelise API."
        : error.message}
    </Alert>
  );
}

/* ------------------------------ Gate surfaces ------------------------------ */

/** Shown when the service exists but the visitor is not signed in. */
export function UnauthorizedPanel({ signInHref }: { signInHref: string }) {
  return (
    <div className="mx-auto w-full max-w-[34rem] px-5 py-16 text-center sm:py-24">
      <span
        aria-hidden="true"
        className="mx-auto grid size-12 place-items-center rounded-[14px] border border-violet/15 bg-tint text-violet-ink"
      >
        <Lock className="size-[1.3rem]" strokeWidth={1.8} />
      </span>
      <h1 className="mt-5 text-[1.5rem] font-extrabold tracking-[-0.03em] text-ink">
        Sign in to open your studio
      </h1>
      <p className="mx-auto mt-2 max-w-[40ch] text-[0.9375rem] leading-[1.65] text-muted-strong">
        Your credits, creations and downloads live behind your Pixelise account.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <Button asChild size="md">
          <Link href={signInHref}>Sign in</Link>
        </Button>
        <Button asChild size="md" variant="secondary">
          <Link href="/">Back to pixelise.in</Link>
        </Button>
      </div>
    </div>
  );
}

/** Shown when the service exists but cannot be reached at all. */
export function ServiceUnavailablePanel({ error }: { error: ApiError }) {
  return (
    <div className="mx-auto w-full max-w-[34rem] px-5 py-16 sm:py-24">
      <ErrorState error={error} onRetry={false} />
      <div className="mt-2 flex justify-center">
        <RetryButton />
      </div>
    </div>
  );
}

/* --------------------------- Small status helpers -------------------------- */

export function SuccessRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 rounded-[12px] border border-[#bfe6d2] bg-[#eefaf3] px-3.5 py-3 text-[0.8125rem] leading-[1.55] text-[#0d6b46]">
      <CheckCircle2 className="mt-px size-4 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

export function TransactionsEmpty() {
  return (
    <EmptyState
      icon={ReceiptText}
      tone="neutral"
      title="No credit activity yet"
      description="Purchases, generations and refunds will appear here with their dates and amounts."
      action={
        <Button asChild size="sm" variant="secondary">
          <Link href="/credits">Browse credit packs</Link>
        </Button>
      }
    />
  );
}
