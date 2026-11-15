import Link from "next/link";

import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/shared/section-heading";
import { PricingCards } from "@/components/marketing/pricing-cards";
import { pricingNotes } from "@/config/pricing";
import { routes } from "@/config/site";

export function PricingSection() {
  return (
    <Section tone="tint" space="lg" divider>
      <SectionHeading
        align="center"
        eyebrow="Pricing"
        index="05"
        title="Credits, not subscriptions."
        lead="Buy a pack once and use the credits when your catalogue needs new visuals. No monthly plan, no renewal you did not ask for."
        className="mx-auto"
      />

      <PricingCards className="mx-auto mt-12 max-w-[56rem]" />

      <div className="mx-auto mt-8 flex max-w-[56rem] flex-col gap-3 rounded-[var(--radius-card)] border border-violet/12 bg-white/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[0.875rem] leading-[1.6] text-muted-strong">
          {pricingNotes.commitment}
        </p>
        <Link
          href={routes.pricing}
          className="shrink-0 rounded text-[0.875rem] font-semibold text-violet-ink underline decoration-violet/30 underline-offset-4 transition-colors hover:decoration-violet"
        >
          Compare the packs
        </Link>
      </div>
    </Section>
  );
}
