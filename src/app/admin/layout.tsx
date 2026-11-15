import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";

import { getAdminSession } from "@/lib/admin-session";
import { SkipLink } from "@/components/layout/skip-link";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminHeader } from "@/components/admin/admin-header";
import { ConsoleShellSkeleton } from "@/components/admin/loading-skeleton";
import {
  ConsoleForbidden,
  ConsoleNotConnectedBanner,
  ConsoleSignInGate,
  ConsoleUnavailable,
} from "@/components/admin/gate-panels";

/**
 * The console frame.
 *
 * Authorization happens here, next to the data, not in a proxy and not in the
 * browser: `getAdminSession()` asks the service who the caller is on every
 * request. The three failure surfaces below render before any child does, so a
 * non-admin never receives a single admin record in the HTML.
 *
 * The whole segment is `noindex, nofollow` and is also disallowed in robots.txt.
 */
export const metadata: Metadata = {
  title: {
    default: "Console",
    template: "%s · Pixelise Console",
  },
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<ConsoleShellSkeleton />}>
      <ConsoleShell>{children}</ConsoleShell>
    </Suspense>
  );
}

async function ConsoleShell({ children }: { children: React.ReactNode }) {
  /*
   * Always render per request. Without this, a build with no admin endpoint
   * configured would prerender the "not connected" shell, and the first real
   * request would resume into a different tree — an authenticated console must
   * never be a static artifact.
   */
  await connection();
  const session = await getAdminSession();

  if (session.state === "unauthenticated") {
    return (
      <>
        <SkipLink />
        <main id="main" tabIndex={-1}>
          <ConsoleSignInGate />
        </main>
      </>
    );
  }

  if (session.state === "forbidden") {
    return (
      <>
        <SkipLink />
        <main id="main" tabIndex={-1}>
          <ConsoleForbidden />
        </main>
      </>
    );
  }

  if (session.state === "unavailable") {
    return (
      <>
        <SkipLink />
        <main id="main" tabIndex={-1}>
          <ConsoleUnavailable message={session.error.message} />
        </main>
      </>
    );
  }

  const account =
    session.state === "authorized"
      ? {
          displayName: session.admin.displayName,
          email: session.admin.email,
          role: session.admin.role,
        }
      : null;

  return (
    <div className="min-h-dvh bg-surface lg:pl-[236px]">
      <SkipLink />
      <AdminSidebar account={account} />
      <div className="flex min-h-dvh flex-col">
        <AdminHeader account={account} />
        {session.state === "unconfigured" ? <ConsoleNotConnectedBanner /> : null}
        <main
          id="main"
          tabIndex={-1}
          className="flex-1 px-3 py-4 focus-visible:outline-none sm:px-5 sm:py-5 lg:px-7"
        >
          <div className="mx-auto w-full max-w-[86rem] space-y-4">{children}</div>
        </main>
      </div>
    </div>
  );
}
