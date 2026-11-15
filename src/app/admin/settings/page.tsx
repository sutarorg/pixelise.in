import { Suspense } from "react";
import type { Metadata } from "next";
import { AlertTriangle, ShieldCheck } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminErrorState } from "@/components/admin/error-state";
import { DetailItem, DetailSection, Unknown } from "@/components/admin/detail-list";
import { StatusBadge } from "@/components/admin/status-badge";
import { TableSkeleton } from "@/components/admin/loading-skeleton";
import { SectionCard } from "@/components/app/section-card";
import { getConfig } from "@/lib/api/admin-server";
import { modelAvailabilityMeta, systemStatusMeta } from "@/config/admin";
import { pricingPacks } from "@/config/pricing";
import { formatCredits, formatDateTime, formatPaise } from "@/lib/format";

export const metadata: Metadata = {
  title: "Configuration",
  description: "Site, generation, payments and email settings.",
};

export default function AdminSettingsPage() {
  return (
    <>
      <AdminPageHeader
        title="Configuration"
        description="How this installation is wired: site identity, generation defaults, payment packs and email delivery. Read-only in this stage — secret values are never returned by the API and are never shown here."
      />
      <Suspense fallback={<SettingsSkeleton />}>
        <SettingsContent />
      </Suspense>
    </>
  );
}

async function SettingsContent() {
  const result = await getConfig();
  if (!result.ok) return <AdminErrorState error={result.error} />;

  const config = result.data;
  const status = systemStatusMeta[config.general.systemStatus];

  return (
    <>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-[10px] border border-line bg-white px-3.5 py-2.5">
        <p className="flex items-center gap-1.5 text-[0.75rem] font-semibold text-ink-soft">
          <ShieldCheck className="size-3.5 text-violet" aria-hidden="true" />
          Configuration is applied by the service
        </p>
        <p className="text-[0.71875rem] text-muted">
          Editing packs or credit rates requires server-side validation and writes an audit entry.
          This endpoint exposes the current values only; no credential, key or webhook secret is part
          of the response.
        </p>
        <p className="ml-auto text-[0.6875rem] text-muted">
          Read {formatDateTime(config.updatedAt)}
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard title="General" description="Site identity, support address and status banner.">
          <DetailSection title="Site">
            <DetailItem label="Site name">{config.general.siteName}</DetailItem>
            <DetailItem label="Support email">
              {config.general.supportEmail ?? <Unknown />}
            </DetailItem>
            <DetailItem label="Support inbox">
              <StatusBadge
                tone={config.general.supportInboxStatus === "configured" ? "success" : "warning"}
              >
                {config.general.supportInboxStatus === "configured" ? "Configured" : "Not configured"}
              </StatusBadge>
            </DetailItem>
            <DetailItem label="System status">
              <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
            </DetailItem>
            <DetailItem label="Status note" wide>
              {config.general.systemStatusNote ?? "No note published"}
            </DetailItem>
          </DetailSection>
        </SectionCard>

        <SectionCard
          title="Generation"
          description="Styles, model availability and credit rates as the studio will read them."
        >
          <DetailSection title="Credit rates">
            {config.generation.creditRates.length === 0 ? (
              <DetailItem label="Rates" wide>
                <Unknown />
              </DetailItem>
            ) : (
              config.generation.creditRates.map((rate) => (
                <DetailItem key={rate.qualityId} label={rate.label}>
                  {formatCredits(rate.credits)} credits
                </DetailItem>
              ))
            )}
          </DetailSection>

          <DetailSection title="Styles">
            <div className="sm:col-span-2 flex flex-wrap gap-1.5">
              {config.generation.styles.length === 0 ? (
                <Unknown />
              ) : (
                config.generation.styles.map((style) => (
                  <StatusBadge key={style.id} tone={style.enabled ? "success" : "neutral"} dot={false}>
                    {style.name} · {style.enabled ? "on" : "off"}
                  </StatusBadge>
                ))
              )}
            </div>
          </DetailSection>

          <DetailSection title="Models">
            <div className="sm:col-span-2 flex flex-wrap gap-1.5">
              {config.generation.models.length === 0 ? (
                <Unknown />
              ) : (
                config.generation.models.map((model) => (
                  <StatusBadge
                    key={model.id}
                    tone={modelAvailabilityMeta[model.availability].tone}
                    dot={false}
                  >
                    {model.name} · {modelAvailabilityMeta[model.availability].label}
                  </StatusBadge>
                ))
              )}
            </div>
          </DetailSection>

          <div className="px-4 pb-4 sm:px-5">
            <p className="text-[0.71875rem] leading-[1.6] text-muted">
              {config.generation.notes ?? "No additional generation notes were configured."}
            </p>
          </div>
        </SectionCard>

        <SectionCard
          title="Payments"
          description="The two published credit packs and the Razorpay integration state."
        >
          <div className="divide-y divide-line">
            {config.payments.packs.length === 0 ? (
              <p className="px-4 py-4 text-[0.75rem] text-muted">
                The API returned no payment packs. Nothing can be sold until one is configured.
              </p>
            ) : (
              config.payments.packs.map((pack) => {
                const published = pricingPacks.find((entry) => entry.id === pack.id);
                const mismatch =
                  published !== undefined &&
                  (published.credits !== pack.credits || published.price * 100 !== pack.pricePaise);
                return (
                  <div key={pack.id} className="px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[0.8125rem] font-bold text-ink">{pack.name}</p>
                      <div className="flex items-center gap-2">
                        <StatusBadge tone={pack.active ? "success" : "neutral"}>
                          {pack.active ? "On sale" : "Inactive"}
                        </StatusBadge>
                        <span className="text-[0.8125rem] font-semibold tabular-nums text-ink">
                          {formatPaise(pack.pricePaise)}
                        </span>
                        <span className="text-[0.75rem] text-muted">
                          {formatCredits(pack.credits)} credits
                        </span>
                      </div>
                    </div>
                    {mismatch && published ? (
                      <p className="mt-1.5 flex items-start gap-1.5 text-[0.71875rem] leading-[1.5] text-[#6a5320]">
                        <AlertTriangle className="mt-px size-3 shrink-0" aria-hidden="true" />
                        This pack differs from the value published on the marketing site (
                        {formatPaise(published.price * 100)} / {formatCredits(published.credits)}{" "}
                        credits). Reconcile it on the server — the console does not edit pricing.
                      </p>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>

          <DetailSection title="Provider">
            <DetailItem label="Provider">{config.payments.provider.name}</DetailItem>
            <DetailItem label="Integration">
              <StatusBadge
                tone={
                  config.payments.provider.status === "configured"
                    ? "success"
                    : config.payments.provider.status === "test_mode"
                      ? "warning"
                      : "danger"
                }
              >
                {config.payments.provider.status === "configured"
                  ? "Live keys configured"
                  : config.payments.provider.status === "test_mode"
                    ? "Test mode"
                    : "Not configured"}
              </StatusBadge>
            </DetailItem>
            <DetailItem label="Webhook">
              <StatusBadge tone={config.payments.webhookConfigured ? "success" : "warning"}>
                {config.payments.webhookConfigured ? "Configured" : "Not configured"}
              </StatusBadge>
            </DetailItem>
            <DetailItem label="Secrets">
              Never returned by the API
            </DetailItem>
          </DetailSection>
        </SectionCard>

        <SectionCard title="Email" description="Delivery provider and which notifications are enabled.">
          <DetailSection title="Service">
            <DetailItem label="Provider">{config.email.provider ?? <Unknown />}</DetailItem>
            <DetailItem label="Status">
              <StatusBadge tone={config.email.status === "configured" ? "success" : "warning"}>
                {config.email.status === "configured" ? "Configured" : "Not configured"}
              </StatusBadge>
            </DetailItem>
          </DetailSection>

          <DetailSection title="Notifications">
            <div className="sm:col-span-2 space-y-1.5">
              {config.email.notifications.length === 0 ? (
                <p className="text-[0.75rem] text-muted">
                  No notification types were returned by the API.
                </p>
              ) : (
                config.email.notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="flex items-center justify-between gap-3 rounded-[7px] border border-line px-2.5 py-1.5"
                  >
                    <span className="text-[0.78125rem] text-ink-soft">{notification.label}</span>
                    <StatusBadge tone={notification.enabled ? "success" : "neutral"} dot={false}>
                      {notification.enabled ? "Enabled" : "Disabled"}
                    </StatusBadge>
                  </div>
                ))
              )}
            </div>
          </DetailSection>
        </SectionCard>
      </div>

      <p className="text-[0.6875rem] leading-[1.6] text-muted">
        Nothing on this page is editable yet. When configuration writes ship, they will require the
        config:write permission, be validated on the server and produce an audit entry — the console
        will never hold a provider secret in its payload, its markup or its bundle.
      </p>
    </>
  );
}

function SettingsSkeleton() {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-[10px] border border-line bg-white">
          <TableSkeleton rows={4} />
        </div>
      ))}
    </div>
  );
}
