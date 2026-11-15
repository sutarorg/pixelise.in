import { Suspense } from "react";
import type { Metadata } from "next";
import { CpuIcon } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminEmptyState } from "@/components/admin/empty-state";
import { AdminErrorState } from "@/components/admin/error-state";
import { StatusBadge } from "@/components/admin/status-badge";
import { ModelRoutingToggle } from "@/components/admin/model-routing-toggle";
import { TableSkeleton } from "@/components/admin/loading-skeleton";
import { can, getAdminSession } from "@/lib/admin-session";
import { listModels } from "@/lib/api/admin-server";
import { modelAvailabilityMeta } from "@/config/admin";
import { formatCredits, formatDateTime } from "@/lib/format";

export const metadata: Metadata = {
  title: "AI Models",
  description: "Providers, endpoints and routing.",
};

export default function AdminModelsPage() {
  return (
    <>
      <AdminPageHeader
        title="AI Models"
        description="The models the studio can route to, with their endpoints, supported modes and credit rates as configured by the service. Nothing on this page calls a provider."
      />
      <Suspense fallback={<ModelsSkeleton />}>
        <ModelsContent />
      </Suspense>
    </>
  );
}

async function ModelsContent() {
  const [result, session] = await Promise.all([listModels(), getAdminSession()]);

  if (!result.ok) return <AdminErrorState error={result.error} />;

  const models = result.data;
  const canWrite = can(session, "models:write");

  if (models.length === 0) {
    return (
      <div className="rounded-[10px] border border-line bg-white">
        <AdminEmptyState
          icon={CpuIcon}
          title="No models configured"
          description="The API returned an empty model list. Until a provider is registered server-side there is nothing to route to, so this page stays empty rather than showing a catalogue."
        />
      </div>
    );
  }

  return (
    <>
      <ul className="space-y-2.5">
        {models.map((model) => (
          <li key={model.id}>
            <article
              aria-labelledby={`model-${model.id}`}
              className="rounded-[10px] border border-line bg-white"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-3.5 py-3 sm:px-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 id={`model-${model.id}`} className="text-[0.9375rem] font-bold text-ink">
                      {model.name}
                    </h2>
                    <StatusBadge tone={modelAvailabilityMeta[model.availability].tone}>
                      {modelAvailabilityMeta[model.availability].label}
                    </StatusBadge>
                    <StatusBadge tone={model.routingEnabled ? "info" : "neutral"} dot={false}>
                      {model.routingEnabled ? "Routing enabled" : "Routing disabled"}
                    </StatusBadge>
                  </div>
                  <p className="mt-1 text-[0.75rem] text-muted">
                    {model.provider} · {model.category} ·{" "}
                    <span className="font-mono text-[0.71875rem]">{model.id}</span>
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <ModelRoutingToggle
                    model={{ id: model.id, name: model.name, routingEnabled: model.routingEnabled }}
                    canWrite={canWrite}
                  />
                  {!canWrite ? (
                    <p className="text-[0.65625rem] text-muted">Requires models:write</p>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-x-6 gap-y-3 px-3.5 py-3 sm:grid-cols-2 sm:px-4 xl:grid-cols-3">
                <Field label="Endpoint" mono>
                  {model.endpoint}
                </Field>
                <Field label="Image modes">
                  {model.imageModes.length > 0 ? model.imageModes.join(", ") : "Not reported"}
                </Field>
                <Field label="Output resolutions">
                  {model.outputResolutions.length > 0
                    ? model.outputResolutions.join(", ")
                    : "Not reported"}
                </Field>
                <Field label="Provider pricing">
                  {model.providerPricing ?? "Not available"}
                </Field>
                <Field label="Updated">
                  {formatDateTime(model.updatedAt)}
                  {model.updatedBy ? ` · ${model.updatedBy}` : ""}
                </Field>
                <Field label="Credit rates">
                  {model.creditRules.length === 0 ? (
                    "Not reported"
                  ) : (
                    <span className="flex flex-wrap gap-1.5">
                      {model.creditRules.map((rule) => (
                        <span
                          key={rule.qualityId}
                          className="inline-flex items-center gap-1 rounded-[5px] border border-line bg-surface px-1.5 py-0.5 text-[0.71875rem] text-ink-soft"
                        >
                          {rule.label}
                          <span className="font-semibold tabular-nums text-ink">
                            {formatCredits(rule.credits)}
                          </span>
                        </span>
                      ))}
                    </span>
                  )}
                </Field>
              </div>
            </article>
          </li>
        ))}
      </ul>

      <div className="rounded-[10px] border border-line bg-white px-4 py-3">
        <p className="text-[0.71875rem] leading-[1.6] text-muted-strong">
          Routing toggles are sent to the service and audited. Credit rates, provider pricing and
          endpoints are read-only in the console: they require a dedicated permission and server-side
          validation, and provider credentials are never returned by the API. A model is only shown
          as supporting the modes the service reports for it — nothing here assumes a capability.
        </p>
      </div>
    </>
  );
}

function Field({
  label,
  children,
  mono = false,
}: {
  label: string;
  children: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[0.65625rem] font-bold uppercase tracking-[0.1em] text-muted">{label}</p>
      <p
        className={
          mono
            ? "mt-0.5 break-all font-mono text-[0.71875rem] text-ink-soft"
            : "mt-0.5 break-words text-[0.78125rem] text-ink-soft"
        }
      >
        {children}
      </p>
    </div>
  );
}

function ModelsSkeleton() {
  return (
    <div className="overflow-hidden rounded-[10px] border border-line bg-white">
      <TableSkeleton rows={6} />
    </div>
  );
}
