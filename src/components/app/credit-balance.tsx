import Link from "next/link";
import { Coins, Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RetryButton } from "@/components/app/retry-button";
import { formatCredits, formatDateTime } from "@/lib/format";
import type { ApiResult, CreditWallet } from "@/lib/api/types";

/**
 * The credit indicator. Always visible in the app header, and given a larger
 * treatment on the dashboard. Values come from `GET /api/v1/credits/wallet`;
 * when that call fails we show a dash rather than a number we cannot stand
 * behind.
 */
export function CreditChip({ wallet }: { wallet: ApiResult<CreditWallet> }) {
  const available = wallet.ok ? formatCredits(wallet.data.available) : null;
  const reserved = wallet.ok ? wallet.data.reserved : 0;

  return (
    <div
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-full border border-line bg-surface pl-2.5 pr-3",
        "text-[0.8125rem] text-muted-strong",
      )}
    >
      <Coins className="size-[1.05rem] text-violet" strokeWidth={1.9} aria-hidden="true" />
      <span className="sr-only">Available credits:</span>
      <span className="font-bold tabular-nums text-ink" aria-hidden="true">
        {available ?? "—"}
      </span>
      <span aria-hidden="true">credits</span>
      {reserved > 0 ? (
        <span className="sr-only">
          {formatCredits(reserved)} credits are reserved by generations in progress.
        </span>
      ) : null}
    </div>
  );
}

export function CreditChipSkeleton() {
  return <Skeleton className="h-9 w-[6.75rem] rounded-full" />;
}

export function BuyCreditsButton({
  className,
  size = "sm",
  variant = "primary",
  label = "Buy credits",
}: {
  className?: string;
  size?: "sm" | "md";
  variant?: "primary" | "secondary";
  label?: string;
}) {
  return (
    <Button asChild size={size} variant={variant} className={className}>
      <Link href="/credits">
        <Plus className="size-4" aria-hidden="true" />
        {label}
      </Link>
    </Button>
  );
}

/** Dashboard balance card. */
export function CreditSummaryCard({ wallet }: { wallet: ApiResult<CreditWallet> }) {
  return (
    <div className="flex h-full flex-col justify-between gap-6 rounded-[var(--radius-card)] border border-line bg-white p-5 shadow-card sm:p-6">
      <div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-muted">
            Credit balance
          </p>
          <Coins className="size-[1.1rem] text-violet" strokeWidth={1.9} aria-hidden="true" />
        </div>

        {wallet.ok ? (
          <>
            <p className="mt-3 flex items-baseline gap-2">
              <span className="text-[2.35rem] font-extrabold leading-none tracking-[-0.04em] text-ink tabular-nums">
                {formatCredits(wallet.data.available)}
              </span>
              <span className="text-[0.875rem] font-semibold text-muted">credits</span>
            </p>
            <p className="mt-2 text-[0.8125rem] text-muted-strong">
              {wallet.data.reserved > 0
                ? `${formatCredits(wallet.data.reserved)} reserved by generations in progress.`
                : "Nothing reserved right now."}
            </p>
            <p className="mt-1 text-[0.75rem] text-muted">
              Updated {formatDateTime(wallet.data.updatedAt)}
            </p>
          </>
        ) : (
          <>
            <p className="mt-3 flex items-baseline gap-2">
              <span className="text-[2.35rem] font-extrabold leading-none tracking-[-0.04em] text-muted">
                —
              </span>
              <span className="text-[0.875rem] font-semibold text-muted">credits</span>
            </p>
            <p className="mt-2 text-[0.8125rem] leading-[1.55] text-muted-strong">
              {wallet.error.code === "not_configured"
                ? "Your balance appears here once the workspace is connected to the Pixelise service."
                : "We couldn't load your balance. Your credits are unaffected."}
            </p>
            {wallet.error.retryable ? (
              <div className="mt-3">
                <RetryButton label="Reload balance" />
              </div>
            ) : null}
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <BuyCreditsButton />
        <Button asChild size="sm" variant="secondary">
          <Link href="/transactions">View transactions</Link>
        </Button>
      </div>
    </div>
  );
}
