import { Check, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatCredits, formatPaise } from "@/lib/format";
import type { CreditPack } from "@/lib/api/types";

/** Price per credit, derived from the pack the server returned. */
function perCredit(pack: CreditPack): string {
  const rupees = pack.pricePaise / 100 / pack.credits;
  return `₹${rupees.toFixed(2)}`;
}

export function CreditPackCard({
  pack,
  action,
}: {
  pack: CreditPack;
  action: React.ReactNode;
}) {
  return (
    <article
      className={cn(
        "relative flex flex-col rounded-[var(--radius-card)] border bg-white p-5 sm:p-6",
        pack.highlighted
          ? "border-violet/30 shadow-[0_2px_4px_rgb(21_21_44_/_0.04),0_26px_50px_-36px_rgb(72_45_200_/_0.45)] ring-1 ring-violet/10"
          : "border-line shadow-card",
      )}
    >
      {pack.badge ? (
        <span className="absolute -top-3 left-5 inline-flex items-center gap-1 rounded-full bg-violet px-2.5 py-1 text-[0.65625rem] font-bold uppercase tracking-[0.1em] text-white">
          <Sparkles className="size-3" strokeWidth={2.4} aria-hidden="true" />
          {pack.badge}
        </span>
      ) : null}

      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-[1.0625rem] font-bold tracking-[-0.02em] text-ink">
          {pack.name}
        </h3>
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-muted">
          One-time
        </p>
      </div>

      <p className="mt-2 flex items-baseline gap-2">
        <span className="text-[2rem] font-extrabold leading-none tracking-[-0.04em] text-ink">
          {formatPaise(pack.pricePaise)}
        </span>
        <span className="text-[0.8125rem] font-semibold text-muted">
          for {formatCredits(pack.credits)} credits
        </span>
      </p>
      <p className="mt-1.5 text-[0.75rem] text-muted">{perCredit(pack)} per credit</p>

      <p className="mt-3 text-[0.8125rem] leading-[1.6] text-muted-strong">{pack.description}</p>

      {pack.includes.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {pack.includes.map((item) => (
            <li key={item} className="flex items-start gap-2 text-[0.8125rem] leading-[1.5] text-ink-soft">
              <Check
                className="mt-0.5 size-3.5 shrink-0 text-success"
                strokeWidth={2.6}
                aria-hidden="true"
              />
              {item}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-5 pt-1">{action}</div>
    </article>
  );
}
