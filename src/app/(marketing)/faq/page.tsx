import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Section } from "@/components/layout/section";
import { PageHero } from "@/components/marketing/page-hero";
import { FaqList } from "@/components/marketing/faq-list";
import { FinalCta } from "@/components/marketing/final-cta";
import { JsonLd } from "@/components/shared/json-ld";
import { Eyebrow } from "@/components/shared/eyebrow";
import { faqs, type FaqItem } from "@/config/content";
import { pageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, faqSchema } from "@/lib/seo/structured-data";
import { routes } from "@/config/site";

export const metadata: Metadata = pageMetadata({
  title: "FAQ — AI Product Photography & Credits",
  description:
    "Answers about how Pixelise works, what product images you can create, how credits and the Creator and Studio packs work, and how to use the images.",
  path: routes.faq,
  keywords: ["AI product photography FAQ", "product photo credits", "Pixelise credits"],
});

const groups: { id: FaqItem["group"]; description: string }[] = [
  {
    id: "Getting started",
    description: "What Pixelise is, how the studio works and what you need to begin.",
  },
  {
    id: "Credits & packs",
    description: "How credits are bought, spent and priced across the two packs.",
  },
  {
    id: "Images & usage",
    description: "Where the finished visuals can be used.",
  },
  {
    id: "Support",
    description: "How to reach a human when something is unclear.",
  },
];

export default function FaqPage() {
  return (
    <>
      <PageHero
        eyebrow="FAQ"
        title="Straight answers, including the ones about money."
        lead="Everything below is written to be checked against the product. Where a policy is still being finalised, this site says so rather than guessing."
        crumbs={[
          { label: "Home", href: routes.home },
          { label: "FAQ" },
        ]}
        actions={
          <>
            <Button asChild size="lg">
              <Link href={routes.getStarted}>Get started</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href={routes.pricing}>See pricing</Link>
            </Button>
          </>
        }
      />

      <Section tone="canvas" space="lg">
        <div className="grid gap-12 lg:grid-cols-[16rem_1fr] lg:gap-16">
          <nav aria-label="FAQ sections" className="lg:sticky lg:top-24 lg:self-start">
            <Eyebrow>On this page</Eyebrow>
            <ul className="mt-4 space-y-2.5">
              {groups.map((group) => (
                <li key={group.id}>
                  <a
                    href={`#${group.id.toLowerCase().replace(/[^a-z]+/g, "-")}`}
                    className="rounded text-[0.875rem] font-medium text-muted-strong transition-colors hover:text-ink"
                  >
                    {group.id}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex flex-col gap-14">
            {groups.map((group) => {
              const items = faqs.filter((faq) => faq.group === group.id);
              if (!items.length) return null;
              return (
                <section
                  key={group.id}
                  id={group.id.toLowerCase().replace(/[^a-z]+/g, "-")}
                  aria-labelledby={`${group.id}-heading`}
                >
                  <h2
                    id={`${group.id}-heading`}
                    className="text-h3 text-ink"
                  >
                    {group.id}
                  </h2>
                  <p className="mt-2 max-w-[40rem] text-[0.9375rem] leading-[1.6] text-muted">
                    {group.description}
                  </p>
                  <FaqList items={items} className="mt-4 border-t border-line" />
                </section>
              );
            })}

            <div className="rounded-[var(--radius-card)] border border-violet/15 bg-tint p-6 sm:p-7">
              <h2 className="text-[1.0625rem] font-bold tracking-[-0.02em] text-ink">
                Question not covered here?
              </h2>
              <p className="mt-2 max-w-[36rem] text-[0.9375rem] leading-[1.62] text-muted-strong">
                The contact page covers support questions about packs, credits
                and images. Refund and legal details live in the policy pages.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button asChild size="md">
                  <Link href={routes.contact}>Contact support</Link>
                </Button>
                <Button asChild size="md" variant="secondary">
                  <Link href={routes.refund}>Refund policy</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Section>

      <FinalCta />
      <JsonLd
        data={[
          faqSchema(faqs),
          breadcrumbSchema([
            { label: "Home", href: routes.home },
            { label: "FAQ", href: routes.faq },
          ]),
        ]}
      />
    </>
  );
}
