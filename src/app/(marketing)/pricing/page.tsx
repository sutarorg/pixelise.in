import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/shared/section-heading";
import { PageHero } from "@/components/marketing/page-hero";
import { PricingCards } from "@/components/marketing/pricing-cards";
import { FaqList } from "@/components/marketing/faq-list";
import { FinalCta } from "@/components/marketing/final-cta";
import { JsonLd } from "@/components/shared/json-ld";
import { IconCheck } from "@/components/shared/icons";
import { faqs } from "@/config/content";
import { formatPrice, pricingNotes, pricingPacks } from "@/config/pricing";
import { pageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, softwareApplicationSchema } from "@/lib/seo/structured-data";
import { links, routes } from "@/config/site";

export const metadata: Metadata = pageMetadata({
  title: "Pricing — One-Time Credit Packs",
  description:
    "Creator: ₹499 for 150 credits. Studio: ₹999 for 350 credits. One-time credit packs with no monthly subscription, for studio, lifestyle and ad visuals.",
  path: routes.pricing,
  keywords: [
    "AI product photography pricing",
    "product photo credits",
    "AI product photo generator price India",
  ],
});

const creditSteps = [
  {
    title: "Buy a pack once",
    body: "Choose Creator or Studio and pay a single time. No card on file, no renewal date.",
  },
  {
    title: "Spend credits in the studio",
    body: "Credits are used when you generate a visual. The cost of a generation is shown in the studio before you commit to it.",
  },
  {
    title: "Nothing renews",
    body: "There is no monthly plan and nothing charges you again automatically. Buy the next pack only when you need one.",
  },
] as const;

const packFaqs = faqs.filter((faq) =>
  ["credits", "pack-difference", "one-time", "usage"].includes(faq.id),
);

function costPerCreditLabel(price: number, credits: number) {
  const paise = Math.round((price / credits) * 100);
  return `₹${(paise / 100).toFixed(2)}`;
}

export default function PricingPage() {
  const [creator, studio] = pricingPacks;

  const rows = [
    {
      label: "Price",
      creator: formatPrice(creator.price),
      studio: formatPrice(studio.price),
    },
    { label: "Credits", creator: String(creator.credits), studio: String(studio.credits) },
    { label: "Payment", creator: "One-time", studio: "One-time" },
    {
      label: "Photography styles",
      creator: "Studio, Lifestyle, Advertising",
      studio: "Studio, Lifestyle, Advertising",
    },
    { label: "Studio features", creator: "Everything included", studio: "Everything included" },
    {
      label: "Cost per credit",
      creator: costPerCreditLabel(creator.price, creator.credits),
      studio: costPerCreditLabel(studio.price, studio.credits),
    },
    { label: "Best for", creator: creator.bestFor, studio: studio.bestFor },
  ];

  return (
    <>
      <PageHero
        eyebrow="Pricing"
        title="Two credit packs. Both bought once."
        lead="Pixelise sells credits, not seats or months. Pick the pack that matches the size of your catalogue and spend the credits as you work through it."
        crumbs={[
          { label: "Home", href: routes.home },
          { label: "Pricing" },
        ]}
        meta={
          <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {["No subscription", "No auto-renewal", "Nothing to cancel"].map(
              (item) => (
                <li
                  key={item}
                  className="flex items-center gap-2 text-[0.8125rem] font-medium text-muted-strong"
                >
                  <IconCheck className="size-4 text-violet" />
                  {item}
                </li>
              ),
            )}
          </ul>
        }
        aside={
          <div className="rounded-[var(--radius-card)] border border-line bg-white p-5 shadow-card">
            <p className="text-[0.8125rem] font-semibold text-ink">
              Not sure which pack to start with?
            </p>
            <p className="mt-1.5 text-[0.8125rem] leading-[1.55] text-muted">
              Creator covers a handful of products. Studio is the pack a full
              catalogue refresh usually needs, and it costs less per credit.
            </p>
            <Button asChild variant="secondary" size="sm" className="mt-4 w-full">
              <Link href={links.getStarted}>Get started</Link>
            </Button>
          </div>
        }
      />

      <Section tone="canvas" space="md">
        <PricingCards ctaHref={links.getStarted} />

        <div className="mt-8 grid gap-3 rounded-[var(--radius-card)] border border-line bg-surface px-5 py-4 sm:grid-cols-2 sm:gap-6">
          <p className="text-[0.875rem] leading-[1.6] text-muted-strong">
            {pricingNotes.commitment}
          </p>
          <p className="text-[0.875rem] leading-[1.6] text-muted-strong">
            {pricingNotes.credits}
          </p>
        </div>
      </Section>

      <Section tone="surface" space="lg" divider>
        <SectionHeading
          eyebrow="Side by side"
          title="What is actually different between the packs."
          lead="The studio is the same in both. The only difference is how many credits you buy and what they cost each."
        />
        <div className="mt-10 overflow-x-auto">
          <table className="w-full min-w-[38rem] border-collapse text-left">
            <caption className="sr-only">
              Comparison of the Creator and Studio credit packs
            </caption>
            <thead>
              <tr className="border-b border-line-strong">
                <th scope="col" className="w-[28%] py-3 pr-4 text-[0.75rem] font-bold uppercase tracking-[0.12em] text-muted">
                  Item
                </th>
                <th scope="col" className="py-3 pr-4 text-[0.9375rem] font-bold text-ink">
                  Creator
                </th>
                <th scope="col" className="py-3 text-[0.9375rem] font-bold text-ink">
                  Studio
                  <span className="ml-2 rounded-full bg-tint px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-[0.1em] text-violet-ink">
                    Popular
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="border-b border-line align-top">
                  <th
                    scope="row"
                    className="py-4 pr-4 text-[0.875rem] font-semibold text-ink-soft"
                  >
                    {row.label}
                  </th>
                  <td className="py-4 pr-4 text-[0.875rem] leading-[1.55] text-muted-strong tabular-nums">
                    {row.creator}
                  </td>
                  <td className="py-4 text-[0.875rem] leading-[1.55] text-muted-strong tabular-nums">
                    {row.studio}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section tone="canvas" space="lg" divider>
        <SectionHeading
          eyebrow="Credits"
          title="How buying a pack works."
          lead="Three things worth knowing before you choose a pack."
        />
        <ul className="mt-10 grid gap-5 lg:grid-cols-3">
          {creditSteps.map((step, index) => (
            <li
              key={step.title}
              className="rounded-[var(--radius-card)] border border-line bg-white p-6 shadow-card"
            >
              <span className="font-mono text-[0.6875rem] tabular-nums tracking-[0.1em] text-muted/70">
                0{index + 1}
              </span>
              <h3 className="mt-4 text-[1.0625rem] font-bold tracking-[-0.02em] text-ink">
                {step.title}
              </h3>
              <p className="mt-2 text-[0.9375rem] leading-[1.62] text-muted-strong">
                {step.body}
              </p>
            </li>
          ))}
        </ul>
        <p className="mt-8 max-w-[52rem] text-[0.875rem] leading-[1.65] text-muted">
          {pricingNotes.rates} Credits are sold in the two packs listed above
          only — there is no third tier, no bonus credit offer and no monthly
          discount plan.
        </p>
      </Section>

      <Section tone="surface" space="lg" divider>
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <SectionHeading
            eyebrow="Pricing questions"
            title="Credits, packs and usage."
            lead="The four questions that come up most before a first purchase."
          />
          <FaqList items={packFaqs} className="border-t border-line" defaultOpen={packFaqs[0]?.id} />
        </div>
      </Section>

      <FinalCta />
      <JsonLd
        data={[
          softwareApplicationSchema(),
          breadcrumbSchema([
            { label: "Home", href: routes.home },
            { label: "Pricing", href: routes.pricing },
          ]),
        ]}
      />
    </>
  );
}
