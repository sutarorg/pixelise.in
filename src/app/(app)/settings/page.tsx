import { Suspense } from "react";
import type { Metadata } from "next";

import { Alert } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/app/page-header";
import { SectionCard } from "@/components/app/section-card";
import { ProfileForm } from "@/components/settings/profile-form";
import { SecuritySection } from "@/components/settings/security-section";
import { PreferencesForm } from "@/components/settings/preferences-form";
import { DeleteAccountSection } from "@/components/settings/delete-account";
import { getPreferences } from "@/lib/api/server";
import { getSession } from "@/lib/session";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Settings",
  description: "Profile, security, notification preferences and account data.",
};

export default function SettingsPage() {
  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeader
        title="Settings"
        description="Your profile, how you sign in, what Pixelise emails you, and what happens to your data."
      />
      <Suspense fallback={<SettingsSkeleton />}>
        <SettingsContent />
      </Suspense>
    </div>
  );
}

async function SettingsContent() {
  const [session, preferences] = await Promise.all([getSession(), getPreferences()]);
  const user = session.state === "authenticated" ? session.user : null;

  return (
    <div className="max-w-[54rem] space-y-4">
      {!user ? (
        <Alert tone="offline" title="No account is connected">
          Profile and preference fields appear once this workspace is connected to the Pixelise
          account service. Nothing is pre-filled or simulated in the meantime.
        </Alert>
      ) : null}

      <SectionCard title="Profile" description="How you appear inside the workspace.">
        {user ? (
          <ProfileForm
            displayName={user.displayName}
            email={user.email}
            emailVerified={user.emailVerified}
          />
        ) : (
          <p className="px-4 py-4 text-[0.8125rem] leading-[1.6] text-muted-strong sm:px-5">
            Name and email come from your Pixelise account.
          </p>
        )}
      </SectionCard>

      <SectionCard title="Security" description="Sign-in, sessions and downloads.">
        <SecuritySection
          signedInAt={null}
          lastSignInAt={user?.lastSignInAt ?? null}
          hasSession={Boolean(user)}
        />
      </SectionCard>

      <SectionCard title="Preferences" description="Only what you opt into is sent.">
        <PreferencesForm
          preferences={preferences.ok ? preferences.data : null}
          unavailable={!preferences.ok && preferences.error.code === "not_configured"}
        />
      </SectionCard>

      <SectionCard title="Account" description="Your account data, and how to remove it.">
        <dl className="divide-y divide-line px-4 sm:px-5">
          <div className="flex items-start justify-between gap-4 py-2.5">
            <dt className="text-[0.75rem] text-muted">Email</dt>
            <dd className="max-w-[60%] break-all text-right text-[0.8125rem] font-semibold text-ink">
              {user?.email ?? "—"}
            </dd>
          </div>
          <div className="flex items-start justify-between gap-4 py-2.5">
            <dt className="text-[0.75rem] text-muted">Member since</dt>
            <dd className="text-right text-[0.8125rem] font-semibold text-ink">
              {user ? formatDate(user.createdAt) : "—"}
            </dd>
          </div>
          <div className="flex items-start justify-between gap-4 py-2.5">
            <dt className="text-[0.75rem] text-muted">Email status</dt>
            <dd className="text-right text-[0.8125rem] font-semibold text-ink">
              {user ? (user.emailVerified ? "Verified" : "Not verified") : "—"}
            </dd>
          </div>
        </dl>
        <div className="border-t border-line">
          <DeleteAccountSection available={Boolean(user)} />
        </div>
      </SectionCard>
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="max-w-[54rem] space-y-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="rounded-[var(--radius-card)] border border-line bg-white p-5 shadow-card">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="mt-4 h-12 w-full" />
          <Skeleton className="mt-3 h-12 w-full" />
        </div>
      ))}
    </div>
  );
}
