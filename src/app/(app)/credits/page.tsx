import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { Coins, CreditCard, ReceiptText, ShieldCheck } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/app/page-header";
import { SectionCard } from "@/components/app/section-card";
import { CreditPackCard } from "@/components/credits/credit-pack-card";
import { CheckoutButton } from "@/components/credits/checkout-button";
import { getPacks } from "@/lib/api/server";
import { pricingPacks } from "@/config/pricing";
import type { CreditPack } from "@/lib/api/types";

export const metadata: Metadata = {
  title: "Buy credits",
  description: "Two one-time credit packs. No subscription, no auto-renewal.",
};

/**
 * The published catalogue, used only when the service cannot return it. Both
 * packs and both prices are already public on pixelise.in; the amount charged is
 * still created server-side at checkout, never taken from this file.
 */
function publishedPacks(): CreditPack[] {
  return pricingPacks.map((pack) => ({
    id: pack.id,
    name: pack.name,
    pricePaise: pack.price * 100,
    currency: "INR",
    credits: pack.credits,
    purchaseType: "one-time",
    highlighted: pack.highlighted,
    badge: pack.badge ?? null,
    description: pack.summary,
    includes: [...pack.features],
  }));
}

export default function CreditsPage() {
  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeader
        title="Buy credits"
        description="Two packs, both one-time purchases. Credits sit in your balance until you generate — nothing renews automatically."
        actions={
          <Link
            href="/transactions"
            className="rounded text-[0.75rem] font-bold text-violet-ink underline decoration-violet/25 underline-offset-4 hover:decoration-violet focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet"
          >
            View credit activity
          </Link>
        }
      />

      <Suspense fallback={<PacksSkeleton />}>
        <PacksSection />
      </Suspense>

      <div className="grid gap-3 sm:grid-cols-3">
        <SectionCard title="One-time, not monthly">
          <p className="px-4 py-3.5 text-[0.8125rem] leading-[1.65] text-muted-strong sm:px-5">
            Pixelise doesn&apos;t sell subscriptions. Each pack is bought once, credits are added to
            your balance, and nothing charges you again.
          </p>
        </SectionCard>
        <SectionCard title="Cost shown before you generate">
          <p className="px-4 py-3.5 text-[0.8125rem] leading-[1.65] text-muted-strong sm:px-5">
            The studio displays the credit cost of a generation next to the style and quality you
            choose. Credits are only reserved when you press Generate.
          </p>
        </SectionCard>
        <SectionCard title="Payments and receipts">
          <p className="px-4 py-3.5 text-[0.8125rem] leading-[1.65] text-muted-strong sm:px-5">
            Checkout runs on Razorpay. For invoices, GST details or a refund question, read the{" "}
            <Link href="/refund-policy" className="font-semibold text-violet-ink underline decoration-violet/30 underline-offset-2">
              refund policy
            </Link>{" "}
            or{" "}
            <Link href="/contact" className="font-semibold text-violet-ink underline decoration-violet/30 underline-offset-2">
              contact us
            </Link>
            .
          </p>
        </SectionCard>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-[12px] border border-line bg-white px-4 py-3 text-[0.75rem] text-muted">
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="size-3.5 text-success" strokeWidth={2} aria-hidden="true" />
          Payments verified server-side
        </span>
        <span className="inline-flex items-center gap-1.5">
          <CreditCard className="size-3.5 text-muted" strokeWidth={2} aria-hidden="true" />
          Razorpay · UPI, cards, netbanking
        </span>
        <span className="inline-flex items-center gap-1.5">
          <ReceiptText className="size-3.5 text-muted" strokeWidth={2} aria-hidden="true" />
          Every purchase appears in transactions
        </span>
      </div>
    </div>
  );
}

async function PacksSection() {
  const result = await getPacks();
  const packs = result.ok && result.data.length > 0 ? result.data : publishedPacks();

  return (
    <div className="space-y-3">
      {!result.ok ? (
        <Alert tone="offline" title="Checkout isn't connected here">
          These are the published packs. Purchases open once this workspace is connected to the
          Pixelise service — nothing can be charged from this screen in the meantime.
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        {packs.map((pack) => (
          <CreditPackCard
            key={pack.id}
            pack={pack}
            action={
              <CheckoutButton
                packId={pack.id}
                highlighted={pack.highlighted}
                label={`Buy ${pack.name} · ${pack.credits} credits`}
              />
            }
          />
        ))}
      </div>

      <p className="flex items-center gap-1.5 text-[0.6875rem] text-muted">
        <Coins className="size-3.5" strokeWidth={2} aria-hidden="true" />
        The amount is always created by the server at checkout, so your browser can never change a
        price.
      </p>
    </div>
  );
}

function PacksSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {Array.from({ length: 2 }).map((_, index) => (
        <div key={index} className="rounded-[var(--radius-card)] border border-line bg-white p-6 shadow-card">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="mt-4 h-9 w-40" />
          <Skeleton className="mt-3 h-3 w-32" />
          <div className="mt-5 space-y-2">
            {Array.from({ length: 4 }).map((__, row) => (
              <Skeleton key={row} className="h-3 w-full" />
            ))}
          </div>
          <Skeleton className="mt-6 h-12 w-full rounded-[11px]" />
        </div>
      ))}
    </div>
  );
}
