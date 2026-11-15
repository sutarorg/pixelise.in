import { Suspense } from "react";
import type { Metadata } from "next";

import { apiError } from "@/lib/api/core";
import { getWallet } from "@/lib/api/server";
import type { ApiResult, CreditWallet } from "@/lib/api/types";
import { getSession, initialsFor } from "@/lib/session";
import { links } from "@/config/site";
import { SkipLink } from "@/components/layout/skip-link";
import { AppHeader } from "@/components/app/app-header";
import { AppSidebar } from "@/components/app/app-sidebar";
import { MobileNav } from "@/components/app/mobile-nav";
import { ShellSkeleton } from "@/components/app/shell-skeleton";
import {
  ServiceUnavailablePanel,
  UnauthorizedPanel,
} from "@/components/app/state-views";

/**
 * The customer application frame.
 *
 * Route protection lives here, next to the data, rather than in a proxy: the
 * Proxy layer is a routing device, and every read below still goes through the
 * workspace service, which is what actually authorizes a request. See
 * docs/research/customer-dashboard-research.md §2.
 *
 * Nothing in this segment is indexable.
 */
export const metadata: Metadata = {
  title: {
    default: "Studio",
    template: "%s | Pixelise Studio",
  },
  robots: { index: false, follow: false, nocache: true },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<ShellSkeleton />}>
      <AppShell>{children}</AppShell>
    </Suspense>
  );
}

async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (session.state === "unauthenticated") {
    return (
      <div className="min-h-dvh bg-surface">
        <SkipLink />
        <main id="main" tabIndex={-1}>
          <UnauthorizedPanel signInHref={links.login} />
        </main>
      </div>
    );
  }

  if (session.state === "unavailable") {
    return (
      <div className="min-h-dvh bg-surface">
        <SkipLink />
        <main id="main" tabIndex={-1}>
          <ServiceUnavailablePanel error={session.error} />
        </main>
      </div>
    );
  }

  const user = session.state === "authenticated" ? session.user : null;
  const accountUser = user
    ? {
        displayName: user.displayName,
        email: user.email,
        initials: initialsFor(user),
      }
    : null;

  const wallet: ApiResult<CreditWallet> =
    session.state === "authenticated"
      ? await getWallet()
      : { ok: false, error: apiError("not_configured") };

  return (
    <div className="min-h-dvh bg-surface lg:pl-[248px]">
      <SkipLink />
      <AppSidebar user={accountUser} wallet={wallet} />
      <div className="flex min-h-dvh flex-col">
        <AppHeader user={accountUser} wallet={wallet} signInHref={links.login} />
        <main
          id="main"
          tabIndex={-1}
          className="flex-1 px-4 pb-24 pt-5 focus-visible:outline-none sm:px-6 lg:px-8 lg:pb-10 lg:pt-7"
        >
          <div className="mx-auto w-full max-w-[78rem]">{children}</div>
        </main>
        <MobileNav user={accountUser} />
      </div>
    </div>
  );
}
