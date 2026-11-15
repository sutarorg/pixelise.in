import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import { getGenerations, getWallet } from "@/lib/api/server";
import { getSession, greetingName } from "@/lib/session";
import { formatCredits } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditSummaryCard } from "@/components/app/credit-balance";
import { ErrorState, EmptyCreations } from "@/components/app/state-views";
import { GenerationCard, GenerationCardSkeleton } from "@/components/creations/generation-card";
import type { ApiResult, CreditWallet, Generation } from "@/lib/api/types";

/* --------------------------------- Welcome --------------------------------- */

export async function DashboardWelcome() {
  const session = await getSession();
  const user = session.state === "authenticated" ? session.user : null;
  const name = greetingName(user);

  return (
    <div>
      <p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-muted">
        {name ? "Your workspace" : "Workspace"}
      </p>
      <h1 className="mt-2 text-[1.5rem] font-extrabold leading-[1.2] tracking-[-0.035em] text-ink sm:text-[1.75rem]">
        {name ? `Welcome back, ${name}` : "Welcome to your studio"}
      </h1>
      <p className="mt-1.5 max-w-[58ch] text-[0.875rem] leading-[1.6] text-muted-strong">
        One product photo is all the studio needs. Start a new visual, or continue from your
        recent creations.
      </p>
    </div>
  );
}

export function WelcomeSkeleton() {
  return (
    <div>
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-7 w-64 max-w-full" />
      <Skeleton className="mt-3 h-3.5 w-full max-w-[34rem]" />
    </div>
  );
}

/* ------------------------------ Credit balance ----------------------------- */

export async function DashboardCredit() {
  const wallet = await getWallet();
  return <CreditSummaryCard wallet={wallet} />;
}

export function DashboardCreditSkeleton() {
  return (
    <div className="rounded-[var(--radius-card)] border border-line bg-white p-5 shadow-card sm:p-6">
      <Skeleton className="h-3 w-28" />
      <Skeleton className="mt-4 h-9 w-24" />
      <Skeleton className="mt-3 h-3 w-40" />
      <div className="mt-6 flex gap-2">
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-9 w-32" />
      </div>
    </div>
  );
}

/* ----------------------------- Recent creations ---------------------------- */

export async function RecentCreations() {
  const result = await getGenerations({ limit: "6" });

  if (!result.ok) {
    return (
      <ErrorState
        error={result.error}
        title="Recent creations are unavailable"
        description={
          result.error.code === "not_configured"
            ? "Your generated visuals appear here as soon as this workspace is connected to the Pixelise service."
            : undefined
        }
        action={
          <Button asChild size="sm">
            <Link href="/studio">
              <Sparkles className="size-4" aria-hidden="true" />
              Open AI Studio
            </Link>
          </Button>
        }
      />
    );
  }

  if (result.data.items.length === 0) {
    return <EmptyCreations context="dashboard" />;
  }

  return (
    <div className="grid grid-cols-2 gap-3 p-3 sm:grid-cols-3 sm:p-4">
      {result.data.items.map((generation: Generation, index) => (
        <GenerationCard key={generation.id} generation={generation} priority={index < 3} />
      ))}
    </div>
  );
}

export function RecentCreationsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 p-3 sm:grid-cols-3 sm:p-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <GenerationCardSkeleton key={index} />
      ))}
    </div>
  );
}

/* ------------------------------ Usage overview ----------------------------- */

export async function UsageOverview() {
  const [wallet, generations] = await Promise.all([
    getWallet(),
    getGenerations({ limit: "1" }),
  ]);

  const rows: { label: string; value: string }[] = [];

  if (generations.ok) {
    const total = generations.data.total ?? generations.data.items.length;
    rows.push({ label: "Generations created", value: formatCredits(total) });
  }
  if (wallet.ok) {
    rows.push({ label: "Credits available", value: formatCredits(wallet.data.available) });
    rows.push({ label: "Credits reserved", value: formatCredits(wallet.data.reserved) });
  }

  if (rows.length === 0) {
    return (
      <div className="px-4 py-6 sm:px-5">
        <p className="text-[0.8125rem] leading-[1.6] text-muted-strong">
          Usage appears here once the workspace is connected to the Pixelise service.
        </p>
        <p className="mt-2 text-[0.75rem] text-muted">
          Nothing is estimated or back-filled in the meantime.
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 py-3 sm:px-5">
      <dl className="divide-y divide-line">
        {rows.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-4 py-2.5">
            <dt className="text-[0.8125rem] text-muted-strong">{row.label}</dt>
            <dd className="text-[0.875rem] font-bold tabular-nums text-ink">{row.value}</dd>
          </div>
        ))}
      </dl>
      <Link
        href="/transactions"
        className="mt-2 inline-flex items-center gap-1.5 rounded text-[0.75rem] font-bold text-violet-ink hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet"
      >
        Credit activity
        <ArrowRight className="size-3.5" strokeWidth={2.2} aria-hidden="true" />
      </Link>
    </div>
  );
}

export function UsageSkeleton() {
  return (
    <div className="space-y-3 px-4 py-4 sm:px-5">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="flex items-center justify-between gap-4">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-10" />
        </div>
      ))}
    </div>
  );
}

/** Exported for the page's Suspense fallback typing convenience. */
export type WalletResult = ApiResult<CreditWallet>;
