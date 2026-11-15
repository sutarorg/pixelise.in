import { ExternalLink } from "lucide-react";

import { DetailItem, DetailSection, Identifier, Unknown } from "@/components/admin/detail-list";
import { StatusBadge } from "@/components/admin/status-badge";
import { generationStatusMeta } from "@/config/admin";
import type { AdminGenerationDetail, AdminIdentity } from "@/lib/api/admin-types";
import { formatCredits, formatDateTime } from "@/lib/format";

/**
 * One generation job.
 *
 * The previews are whatever short-lived URLs the service issued for *this*
 * request. No storage key, bucket name or provider credential is rendered, and
 * when the service withholds a preview the panel says so instead of building a
 * URL of its own. The failure message is the sanitized text from the API — this
 * component never prints a stack trace or a raw provider payload.
 */
export function GenerationDetailBody({
  generation,
  viewer,
}: {
  generation: AdminGenerationDetail;
  viewer: AdminIdentity | null;
}) {
  const meta = generationStatusMeta[generation.status];

  return (
    <div>
      <div className="border-b border-line px-5 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
          <span className="font-mono text-[0.71875rem] text-muted">{generation.id}</span>
        </div>
        <p className="mt-1.5 text-[0.8125rem] text-ink-soft">
          {generation.styleName} · {generation.modelName} · {generation.qualityLabel}
        </p>
      </div>

      <DetailSection
        title="Assets"
        description="Signed, short-lived URLs issued by the service for this view. Access is authorized server-side and audited."
      >
        <div className="sm:col-span-2 grid gap-2.5 sm:grid-cols-2">
          <PreviewPanel
            label="Source photo"
            url={generation.sourcePreviewUrl}
            alt="Source photo uploaded by the customer"
          />
          <PreviewPanel
            label="Result"
            url={generation.resultPreviewUrl}
            alt="Generated visual produced by the model"
          />
        </div>
      </DetailSection>

      <DetailSection title="Job">
        <DetailItem label="Customer" wide>
          {generation.userLabel}
          <span className="ml-1.5 font-mono text-[0.6875rem] text-muted">{generation.userId}</span>
        </DetailItem>
        <DetailItem label="Scene">{generation.sceneName ?? <Unknown />}</DetailItem>
        <DetailItem label="Started">{formatDateTime(generation.createdAt)}</DetailItem>
        <DetailItem label="Duration">
          {generation.durationMs === null ? <Unknown /> : formatDuration(generation.durationMs)}
        </DetailItem>
        <DetailItem label="Credits charged">
          {generation.creditsCharged === null ? <Unknown /> : formatCredits(generation.creditsCharged)}
        </DetailItem>
        <DetailItem label="Credits reserved">
          {generation.creditsReserved === null ? <Unknown /> : formatCredits(generation.creditsReserved)}
        </DetailItem>
      </DetailSection>

      <DetailSection
        title="Provider"
        description="Operational identifiers only. Credentials never leave the backend."
      >
        <DetailItem label="Model" wide>
          {generation.modelName}{" "}
          <span className="font-mono text-[0.6875rem] text-muted">{generation.modelId}</span>
        </DetailItem>
        <DetailItem label="Endpoint">{generation.modelEndpoint ?? <Unknown />}</DetailItem>
        <DetailItem label="Provider request ID">
          <Identifier value={generation.providerRequestId} />
        </DetailItem>
      </DetailSection>

      {generation.status === "failed" ? (
        <DetailSection
          title="Failure"
          description="Sanitized by the service. Raw provider payloads are not stored or shown."
        >
          <DetailItem label="Failure code">
            {generation.failureCode ? (
              <code className="rounded-[5px] bg-surface px-1.5 py-0.5 font-mono text-[0.71875rem]">
                {generation.failureCode}
              </code>
            ) : (
              <Unknown />
            )}
          </DetailItem>
          <DetailItem label="Safe error message" wide>
            {generation.failureMessage ?? <Unknown />}
          </DetailItem>
        </DetailSection>
      ) : null}

      <DetailSection title="Status history" description="Append-only transitions recorded by the service.">
        <div className="sm:col-span-2">
          {generation.statusHistory.length === 0 ? (
            <p className="text-[0.75rem] text-muted">
              No transitions recorded. The API returned an empty history for this job.
            </p>
          ) : (
            <ol className="space-y-2">
              {generation.statusHistory.map((entry, index) => {
                const entryMeta = generationStatusMeta[entry.status];
                return (
                  <li key={`${entry.status}-${entry.at}-${index}`} className="flex gap-2.5">
                    <span
                      aria-hidden="true"
                      className="mt-1.5 size-1.5 shrink-0 rounded-full bg-line-strong"
                    />
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2">
                        <StatusBadge tone={entryMeta.tone}>{entryMeta.label}</StatusBadge>
                        <time dateTime={entry.at} className="text-[0.71875rem] text-muted">
                          {formatDateTime(entry.at)}
                        </time>
                      </p>
                      {entry.note ? (
                        <p className="mt-0.5 text-[0.75rem] text-muted-strong">{entry.note}</p>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </DetailSection>

      <div className="px-5 py-3 text-[0.6875rem] leading-[1.6] text-muted">
        Viewing as {viewer?.displayName?.trim() || viewer?.email || "an unverified session"}. Every
        request for this panel is checked by the service; the console holds no record cache.
      </div>
    </div>
  );
}

function PreviewPanel({ label, url, alt }: { label: string; url: string | null; alt: string }) {
  return (
    <figure className="min-w-0">
      <figcaption className="mb-1 text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-muted">
        {label}
      </figcaption>
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noreferrer noopener"
          className="group block overflow-hidden rounded-[8px] border border-line bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={alt}
            className="h-40 w-full object-contain"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
          <span className="flex items-center justify-between gap-2 border-t border-line bg-white px-2 py-1 text-[0.65625rem] text-muted group-hover:text-ink-soft">
            Opens the signed URL in a new tab
            <ExternalLink className="size-3" aria-hidden="true" />
          </span>
        </a>
      ) : (
        <div className="grid h-40 place-items-center rounded-[8px] border border-dashed border-line-strong bg-surface px-3 text-center">
          <p className="text-[0.71875rem] leading-[1.5] text-muted">
            Not provided for this record.
            <span className="mt-0.5 block text-[0.65625rem]">
              The service did not issue a preview URL.
            </span>
          </p>
        </div>
      )}
    </figure>
  );
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)} ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)} s`;
  const minutes = Math.floor(ms / 60_000);
  const seconds = Math.round((ms % 60_000) / 1000);
  return `${minutes}m ${seconds}s`;
}
