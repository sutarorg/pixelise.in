import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconCheck } from "@/components/shared/icons";
import { costPerCredit, formatPrice, pricingPacks } from "@/config/pricing";
import { links } from "@/config/site";
import { cn } from "@/lib/utils";

export function PricingCards({
  ctaHref = links.getStarted,
  className,
}: {
  ctaHref?: string;
  className?: string;
}) {
  const cheapest = Math.min(...pricingPacks.map(costPerCredit));

  return (
    <ul className={cn("grid gap-5 lg:grid-cols-2 lg:gap-6", className)}>
      {pricingPacks.map((pack) => {
        const isBestValue = costPerCredit(pack) === cheapest;
        return (
          <li key={pack.id} id={pack.id} className="h-full">
            <article
              className={cn(
                "relative flex h-full flex-col rounded-[var(--radius-card)] bg-white p-7 sm:p-8",
                pack.highlighted
                  ? "border border-violet/35 shadow-[0_2px_4px_rgb(21_21_44_/_0.04),0_34px_64px_-44px_rgb(72_45_200_/_0.5)] ring-1 ring-violet/10"
                  : "border border-line shadow-card",
              )}
            >
              {pack.badge ? (
                <Badge
                  variant="violet"
                  size="eyebrow"
                  className="absolute -top-3 left-7 shadow-[0_6px_14px_-8px_rgb(96_69_245_/_0.9)]"
                >
                  {pack.badge}
                </Badge>
              ) : null}

              <div className="flex items-start justify-between gap-4">
                <h3 className="text-[1.0625rem] font-bold tracking-[-0.01em] text-ink">
                  {pack.name}
                </h3>
                <Badge variant="outline" size="sm" className="mt-0.5">
                  One-time
                </Badge>
              </div>

              <p className="mt-2 max-w-[26rem] text-[0.875rem] leading-[1.6] text-muted">
                {pack.summary}
              </p>

              <div className="mt-6 flex items-end gap-2">
                <span className="text-[2.75rem] font-extrabold leading-none tracking-[-0.045em] text-ink tabular-nums">
                  {formatPrice(pack.price)}
                </span>
                <span className="pb-1 text-[0.8125rem] font-medium text-muted">
                  one-time purchase
                </span>
              </div>

              <div className="mt-5 flex items-baseline justify-between gap-3 rounded-[10px] border border-line bg-surface px-4 py-3">
                <span className="text-[0.9375rem] font-semibold text-ink">
                  <span className="tabular-nums">{pack.credits}</span> credits
                </span>
                <span className="text-[0.75rem] text-muted">
                  <span className="tabular-nums">
                    ₹{(costPerCredit(pack) / 100).toFixed(2)}
                  </span>{" "}
                  per credit
                  {isBestValue ? " · best value" : ""}
                </span>
              </div>

              <p className="mt-4 text-[0.8125rem] leading-[1.55] text-muted">
                <span className="font-semibold text-ink-soft">Best for:</span>{" "}
                {pack.bestFor}
              </p>

              <ul className="mt-6 space-y-2.5 border-t border-line pt-6">
                {pack.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <IconCheck className="mt-0.5 size-4 shrink-0 text-violet" />
                    <span className="text-[0.875rem] leading-[1.55] text-muted-strong">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-8">
                <Button
                  asChild
                  size="lg"
                  variant={pack.highlighted ? "primary" : "secondary"}
                  className="w-full"
                >
                  <Link href={ctaHref}>{pack.ctaLabel}</Link>
                </Button>
              </div>
            </article>
          </li>
        );
      })}
    </ul>
  );
}
