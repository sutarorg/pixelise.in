import { Suspense } from "react";
import type { Metadata } from "next";

import { SectionCard, SectionLink } from "@/components/app/section-card";
import { PrimaryAction } from "@/components/dashboard/primary-action";
import { QuickStart } from "@/components/dashboard/quick-start";
import {
  DashboardCredit,
  DashboardCreditSkeleton,
  DashboardWelcome,
  RecentCreations,
  RecentCreationsSkeleton,
  UsageOverview,
  UsageSkeleton,
  WelcomeSkeleton,
} from "@/components/dashboard/dashboard-sections";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your credit balance, recent creations and the next step in the studio.",
};

export default function DashboardPage() {
  return (
    <div className="space-y-4 sm:space-y-5">
      <Suspense fallback={<WelcomeSkeleton />}>
        <DashboardWelcome />
      </Suspense>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_21rem]">
        <PrimaryAction />
        <Suspense fallback={<DashboardCreditSkeleton />}>
          <DashboardCredit />
        </Suspense>
      </div>

      <QuickStart />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_21rem]">
        <SectionCard
          title="Recent creations"
          description="The last six visuals you generated."
          action={<SectionLink href="/creations">View all</SectionLink>}
          bodyClassName="p-0"
        >
          <Suspense fallback={<RecentCreationsSkeleton />}>
            <RecentCreations />
          </Suspense>
        </SectionCard>

        <SectionCard
          title="Usage"
          description="Actual figures from your account."
          bodyClassName="p-0"
        >
          <Suspense fallback={<UsageSkeleton />}>
            <UsageOverview />
          </Suspense>
        </SectionCard>
      </div>
    </div>
  );
}
