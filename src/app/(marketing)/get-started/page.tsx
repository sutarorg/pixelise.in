import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/shared/section-heading";
import { PageHero } from "@/components/marketing/page-hero";
import { PricingCards } from "@/components/marketing/pricing-cards";
import { FaqList } from "@/components/marketing/faq-list";
import { JsonLd } from "@/components/shared/json-ld";
import { Eyebrow } from "@/components/shared/eyebrow";
import {
  IconDownload,
  IconGenerate,
  IconSwatch,
  IconUpload,
} from "@/components/shared/icons";
import { faqs, processSteps } from "@/config/content";
import { pricingNotes } from "@/config/pricing";
import { pageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema } from "@/lib/seo/structured-data";
import { links, routes, siteConfig } from "@/config/site";

export const metadata: Metadata = pageMetadata({
  title: "Get Started",
  description:
    "Choose the Creator or Studio credit pack, see what happens next, and learn how studio access opens. One-time purchases from ₹499, never a subscription.",
  path: routes.getStarted,
});

const stepIcons = [IconUpload, IconSwatch, IconGenerate, IconDownload] as const;

const startFaqs = faqs.filter((faq) =>
  ["what-is-pixelise", "credits", "pack-difference", "support"].includes(faq.id),
);

export default function GetStartedPage() {
  return (
    <>
      <PageHero
        eyebrow="Get started"
        title="Start with the pack that matches your catalogue."
        lead="Pick a pack, prepare one product photo, and choose the style your placement needs. Both packs are one-time purchases — nothing renews and there is no plan to cancel."
        crumbs={[
          { label: "Home", href: routes.home },
          { label: "Get started" },
        ]}
        meta={
          <p className="text-[0.8125rem] leading-[1.6] text-muted">
            {pricingNotes.commitment}
          </p>
        }
        aside={
          <div
            id="studio-access"
            className="rounded-[var(--radius-card)] border border-violet/20 bg-tint p-6"
          >
            <Eyebrow>Studio access</Eyebrow>
            <p className="mt-3 text-[0.9375rem] leading-[1.6] text-ink">
              The public site and the studio workspace are delivered separately.
              Credit checkout and account access open with the studio app, so
              they are intentionally not simulated here.
            </p>
            <ul className="mt-4 space-y-2">
              <li className="text-[0.8125rem] leading-[1.5] text-muted-strong">
                <span className="font-semibold text-ink-soft">Available now:</span>{" "}
                the full feature tour, the examples gallery and every policy page.
              </li>
              <li className="text-[0.8125rem] leading-[1.5] text-muted-strong">
                <span className="font-semibold text-ink-soft">Opening with the studio:</span>{" "}
                account creation, credit checkout and image generation.
              </li>
            </ul>
            <Button asChild variant="secondary" size="sm" className="mt-5 w-full">
              <Link href={routes.examples}>Explore examples</Link>
            </Button>
          </div>
        }
      />

      <Section tone="canvas" space="lg">
        <SectionHeading
          eyebrow="Choose a pack"
          title="Two packs. One payment each."
          lead="The studio is identical in both. The difference is how many credits you buy and what they cost each."
        />
        <PricingCards className="mt-10" ctaHref="#studio-access" />
      </Section>

      <Section tone="surface" space="lg" divider>
        <SectionHeading
          eyebrow="What happens next"
          title="Four steps from here."
          lead="Once checkout is connected, this is the whole workflow — nothing else is required to produce a finished visual."
          action={
            <Button asChild variant="secondary">
              <Link href={routes.howItWorks}>Detailed walkthrough</Link>
            </Button>
          }
        />
        <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {processSteps.map((step, index) => {
            const Icon = stepIcons[index] ?? IconUpload;
            return (
              <li
                key={step.number}
                className="rounded-[var(--radius-card)] border border-line bg-white p-6 shadow-card"
              >
                <div className="flex items-center justify-between">
                  <span className="grid size-10 place-items-center rounded-[10px] border border-violet/12 bg-tint text-violet">
                    <Icon className="size-5" />
                  </span>
                  <span className="font-mono text-[0.6875rem] tabular-nums tracking-[0.1em] text-muted/60">
                    {step.number}
                  </span>
                </div>
                <h3 className="mt-5 text-[0.9375rem] font-bold leading-snug tracking-[-0.015em] text-ink">
                  {step.title}
                </h3>
                <p className="mt-2 text-[0.8125rem] leading-[1.55] text-muted-strong">
                  {step.summary}
                </p>
              </li>
            );
          })}
        </ol>
      </Section>

      <Section tone="canvas" space="lg" divider>
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <SectionHeading
            eyebrow="Before you buy"
            title="Four questions worth reading first."
            lead="If none of these cover it, the full FAQ and the contact page are one click away."
          />
          <FaqList items={startFaqs} className="border-t border-line" />
        </div>
        <div className="mt-10 flex flex-wrap gap-3">
          <Button asChild>
            <Link href={routes.pricing}>Compare packs in detail</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href={routes.contact}>Contact support</Link>
          </Button>
          {links.appConnected ? (
            <Button asChild variant="secondary">
              <a href={links.appStudio} rel="noopener">
                Open the studio
              </a>
            </Button>
          ) : null}
        </div>
        <p className="mt-6 text-[0.75rem] leading-[1.5] text-muted">
          {siteConfig.name} publishes no trial credits, discount codes or bonus
          credit offers. The two packs above are the full product line.
        </p>
      </Section>

      <JsonLd
        data={breadcrumbSchema([
          { label: "Home", href: routes.home },
          { label: "Get started", href: routes.getStarted },
        ])}
      />
    </>
  );
}
