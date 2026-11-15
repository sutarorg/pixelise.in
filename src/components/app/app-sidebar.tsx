import Link from "next/link";
import { ArrowUpRight, Coins, Settings, User } from "lucide-react";

import { cn } from "@/lib/utils";
import { Logo } from "@/components/layout/logo";
import { SidebarNav } from "@/components/app/sidebar-nav";
import { formatCredits } from "@/lib/format";
import type { AccountMenuUser } from "@/components/app/account-menu";
import type { ApiResult, CreditWallet } from "@/lib/api/types";

export function AppSidebar({
  user,
  wallet,
}: {
  user: AccountMenuUser | null;
  wallet: ApiResult<CreditWallet>;
}) {
  return (
    <aside
      aria-label="Sidebar"
      className="fixed inset-y-0 left-0 z-40 hidden w-[248px] flex-col border-r border-line bg-white lg:flex"
    >
      <div className="flex h-16 shrink-0 items-center border-b border-line px-5">
        <Logo href="/dashboard" />
      </div>

      <SidebarNav />

      <div className="shrink-0 space-y-2.5 border-t border-line px-3 py-3">
        <div className="rounded-[12px] border border-line bg-surface px-3 py-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[0.65625rem] font-bold uppercase tracking-[0.14em] text-muted">
              Credits
            </span>
            <Coins className="size-3.5 text-violet" strokeWidth={2} aria-hidden="true" />
          </div>
          <p className="mt-1 flex items-baseline gap-1.5">
            <span className="text-[1.125rem] font-extrabold leading-none tracking-[-0.03em] text-ink tabular-nums">
              {wallet.ok ? formatCredits(wallet.data.available) : "—"}
            </span>
            <span className="text-[0.6875rem] font-semibold text-muted">available</span>
          </p>
          <Link
            href="/credits"
            className="mt-2 inline-flex items-center gap-1 rounded text-[0.75rem] font-bold text-violet-ink hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet"
          >
            Buy credits
            <ArrowUpRight className="size-3" strokeWidth={2.4} aria-hidden="true" />
          </Link>
        </div>

        <div className="flex items-center gap-2.5 rounded-[12px] px-1 py-1">
          <span
            aria-hidden="true"
            className={cn(
              "grid size-8 shrink-0 place-items-center rounded-full border border-violet/15 bg-tint",
              "text-[0.6875rem] font-bold text-violet-ink",
            )}
          >
            {user?.initials ?? <User className="size-[0.9rem]" strokeWidth={2} />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.75rem] font-bold leading-tight text-ink">
              {user?.displayName ?? (user ? "Your account" : "Not signed in")}
            </p>
            <p className="truncate text-[0.6875rem] leading-tight text-muted">
              {user?.email ?? "No account connected"}
            </p>
          </div>
          <Link
            href="/settings"
            aria-label="Account settings"
            className="grid size-8 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-ink/[0.05] hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet"
          >
            <Settings className="size-4" strokeWidth={1.9} aria-hidden="true" />
          </Link>
        </div>

        <Link
          href="/"
          className="flex items-center justify-between rounded-[8px] px-1 text-[0.6875rem] font-semibold text-muted transition-colors hover:text-ink-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet"
        >
          pixelise.in
          <ArrowUpRight className="size-3" strokeWidth={2.2} aria-hidden="true" />
        </Link>
      </div>
    </aside>
  );
}
