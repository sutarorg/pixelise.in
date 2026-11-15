import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { adminNavGroups } from "@/config/admin";
import { AdminNav } from "@/components/admin/admin-nav";
import { AdminSignOut } from "@/components/admin/admin-sign-out";

export type AdminAccount = {
  displayName: string | null;
  email: string;
  role: string;
};

/**
 * Persistent left rail. On phones the same navigation is rendered inside a
 * drawer from the header, so no section is ever unreachable at 320px.
 */
export function AdminSidebar({ account }: { account: AdminAccount | null }) {
  const initials = account
    ? (account.displayName?.trim()?.[0] ?? account.email[0])?.toUpperCase()
    : null;

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[236px] flex-col border-r border-line bg-white lg:flex">
      <div className="flex h-14 items-center gap-2 border-b border-line px-4">
        <Link
          href="/admin"
          className="flex min-w-0 items-center gap-2 rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet"
        >
          <span
            aria-hidden="true"
            className="grid size-6 place-items-center rounded-[7px] bg-ink text-[0.6875rem] font-extrabold text-white"
          >
            P
          </span>
          <span className="truncate text-[0.875rem] font-extrabold tracking-[-0.02em] text-ink">
            Pixelise
          </span>
          <span className="rounded-[4px] border border-line-strong bg-surface px-1.5 py-0.5 text-[0.5625rem] font-bold uppercase tracking-[0.1em] text-muted-strong">
            Admin
          </span>
        </Link>
      </div>

      <AdminNav />

      <div className="border-t border-line px-2.5 py-3">
        <Link
          href="/"
          className="mb-3 flex h-7 items-center gap-1.5 rounded px-2.5 text-[0.75rem] font-semibold text-muted-strong transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet"
        >
          <ArrowUpRight className="size-3.5" strokeWidth={2} aria-hidden="true" />
          Return to website
        </Link>

        <div className="flex items-center gap-2 rounded-[8px] border border-line bg-surface px-2 py-2">
          <span
            aria-hidden="true"
            className="grid size-7 shrink-0 place-items-center rounded-full bg-ink text-[0.6875rem] font-bold text-white"
          >
            {initials ?? "·"}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.75rem] font-bold text-ink">
              {account?.displayName?.trim() || account?.email || "Console access"}
            </p>
            <p className="truncate text-[0.65625rem] text-muted">
              {account ? `${account.role} · ${account.email}` : "Not connected to the service"}
            </p>
          </div>
        </div>
        <div className="mt-2.5 flex items-center justify-between gap-2 px-1">
          <AdminSignOut />
          <p className="text-right text-[0.59375rem] leading-[1.3] text-muted/80">
            {adminNavGroups.length} groups
          </p>
        </div>
      </div>
    </aside>
  );
}
