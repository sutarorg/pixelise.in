import { Alert } from "@/components/ui/alert";
import { RetryButton } from "@/components/app/retry-button";
import { cn } from "@/lib/utils";
import type { ApiError } from "@/lib/api/types";

/**
 * Transport failure for a region of the console.
 *
 * The error code, status and request id are shown because an operator needs them
 * to raise a ticket — but they are behind a disclosure so they never dominate the
 * message. Nothing is retried automatically: a refresh is an explicit choice.
 */
export function AdminRegionError({
  error,
  title = "This section couldn't load",
  description,
  className,
}: {
  error: ApiError;
  title?: string;
  description?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("p-3", className)}>
      <Alert
        tone={error.code === "unauthenticated" || error.code === "forbidden" ? "danger" : "offline"}
        title={title}
        action={error.retryable ? <RetryButton label="Reload section" /> : undefined}
      >
        <p>{description ?? humanMessage(error)}</p>
        <details className="mt-2">
          <summary className="w-fit cursor-pointer list-none text-[0.71875rem] font-semibold text-muted underline decoration-line-strong underline-offset-4 hover:text-ink-soft">
            Request details
          </summary>
          <dl className="mt-1.5 grid gap-1 font-mono text-[0.6875rem]">
            <div className="flex gap-2">
              <dt className="text-muted">code</dt>
              <dd className="text-ink-soft">{error.code}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted">status</dt>
              <dd className="text-ink-soft">{error.status || "no response"}</dd>
            </div>
            {error.requestId ? (
              <div className="flex gap-2">
                <dt className="text-muted">request</dt>
                <dd className="break-all text-ink-soft">{error.requestId}</dd>
              </div>
            ) : null}
          </dl>
        </details>
      </Alert>
    </div>
  );
}

/**
 * Whole-page failure (the route could not read its primary resource at all).
 * The surrounding shell stays usable so the operator can move to another section.
 */
export function AdminErrorState({
  error,
  title,
  description,
}: {
  error: ApiError;
  title?: string;
  description?: React.ReactNode;
}) {
  const offline =
    error.code === "service_unavailable" ||
    error.code === "network_error" ||
    error.code === "not_configured";

  return (
    <div className="rounded-[10px] border border-line bg-white p-5 sm:p-6">
      <p className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-muted">
        {offline ? "Service unavailable" : "Request failed"}
      </p>
      <h2 className="mt-1.5 text-[1.0625rem] font-bold tracking-[-0.02em] text-ink">
        {title ?? (offline ? "The console can't reach the API" : "That request wasn't accepted")}
      </h2>
      <p className="mt-1.5 max-w-[62ch] text-[0.8125rem] leading-[1.6] text-muted-strong">
        {description ?? humanMessage(error)}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {error.retryable ? <RetryButton label="Try again" /> : null}
      </div>
      <details className="mt-4 border-t border-line pt-3">
        <summary className="w-fit cursor-pointer list-none text-[0.71875rem] font-semibold text-muted underline decoration-line-strong underline-offset-4 hover:text-ink-soft">
          Technical details
        </summary>
        <dl className="mt-2 grid gap-1 font-mono text-[0.6875rem] text-muted-strong">
          <div className="flex gap-2">
            <dt>code</dt>
            <dd className="text-ink-soft">{error.code}</dd>
          </div>
          <div className="flex gap-2">
            <dt>status</dt>
            <dd className="text-ink-soft">{error.status || "no response"}</dd>
          </div>
          {error.requestId ? (
            <div className="flex gap-2">
              <dt>request</dt>
              <dd className="break-all text-ink-soft">{error.requestId}</dd>
            </div>
          ) : null}
        </dl>
      </details>
    </div>
  );
}

function humanMessage(error: ApiError): string {
  switch (error.code) {
    case "not_configured":
      return "This build has no admin API endpoint configured, so no records can be shown. Nothing here is simulated.";
    case "unauthenticated":
      return "The session is no longer valid. Sign in again to continue.";
    case "forbidden":
      return "This account isn't allowed to read this record. The service made the decision, not the browser.";
    case "not_found":
      return "The record no longer exists, or the identifier is wrong.";
    case "rate_limited":
      return "Too many requests in a short window. Wait a moment, then reload.";
    case "service_unavailable":
    case "network_error":
      return "The API didn't answer. No changes were made by this request.";
    default:
      return error.message;
  }
}
