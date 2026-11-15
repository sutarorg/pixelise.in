import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/shared/section-heading";
import { PageHero } from "@/components/marketing/page-hero";
import { FeatureGrid } from "@/components/marketing/feature-grid";
import { FeatureRow } from "@/components/marketing/feature-row";
import { StylesShowcase } from "@/components/marketing/styles-showcase";
import { UseCaseGrid } from "@/components/marketing/use-case-grid";
import { FinalCta } from "@/components/marketing/final-cta";
import { JsonLd } from "@/components/shared/json-ld";
import { pricingNotes, pricingPacks, formatPrice } from "@/config/pricing";
import { pageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema } from "@/lib/seo/structured-data";
import { links, routes } from "@/config/site";

export const metadata: Metadata = pageMetadata({
  title: "Features — AI Product Photography for Ecommerce",
  description:
    "Studio-grade renders that keep your product intact, three distinct photography styles, a workflow that replaces a shoot day, and one-time credit packs.",
  path: routes.features,
  keywords: [
    "AI product photography features",
    "AI product photo generator",
    "ecommerce product photography",
  ],
});

export default function FeaturesPage() {
  return (
    <>
      <PageHero
        eyebrow="Features"
        title="A studio built around your product, not around a prompt."
        lead="Pixelise is not an image generator you describe a product to. You give it the product — and the studio builds light, surface, set and shadow around what is already there."
        crumbs={[
          { label: "Home", href: routes.home },
          { label: "Features" },
        ]}
        actions={
          <>
            <Button asChild size="lg">
              <Link href={links.getStarted}>Get started</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href={routes.examples}>Explore examples</Link>
            </Button>
          </>
        }
      />

      <FeatureGrid
        eyebrow="Capabilities"
        index="01"
        title="Four things the studio has to get right."
        lead="Product photography fails on details: a label that warps, a shadow that floats, a highlight that blows out. These are the four areas Pixelise is engineered around."
        showAction={false}
      />

      <Section tone="canvas" space="lg" divider>
        <FeatureRow
          eyebrow="Professional quality"
          title="The product stays the product."
          imageKey="usecaseJewellery"
          alt="Gold signet ring with an emerald on polished dark stone"
          body={
            <p className="mt-5">
              A render that changes the shape of your product is worse than no
              render at all. Pixelise holds the object steady — proportions,
              label placement, colour, finish — and rebuilds only the scene
              around it, so what arrives is a better photograph of the same thing.
            </p>
          }
          bullets={[
            "Labels stay square to the camera, with no re-lettering.",
            "Glass keeps refraction; metal keeps one clean specular line.",
            "Surface contact shadows connect to the base, so nothing floats.",
            "Reflections behave like the surface they sit on.",
          ]}
        />
      </Section>

      <div id="photography-styles">
        <StylesShowcase />
      </div>

      <Section tone="canvas" space="lg" divider>
        <FeatureRow
          eyebrow="Fast generation"
          title="The slow part of product photography was never the camera."
          imageKey="usecaseFood"
          alt="Kraft coffee packaging photographed on a sand surface with roasted beans"
          reverse
          body={
            <>
              <p className="mt-5">
                A reshoot means samples, a courier, a set, props, a photographer
                and a retoucher — then a second round when the label changes. With
                Pixelise the only thing to prepare is a photo of the product you
                already have in stock.
              </p>
              <p className="mt-4">
                Send the photo, choose the style and review the result in the same
                session. If the set is not right, change the direction and
                generate again.
              </p>
            </>
          }
          footer={
            <Button asChild variant="secondary">
              <Link href={routes.howItWorks}>See the four-step workflow</Link>
            </Button>
          }
        />
      </Section>

      <Section tone="canvas" space="lg" divider>
        <SectionHeading
          eyebrow="Cost-effective"
          index="04"
          title="Priced like a purchase, not like a subscription."
          lead="Two credit packs, bought once. You spend credits when a product needs a new scene — not every month whether you shoot or not."
        />
        <div className="mt-10 grid gap-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-14">
          <ul className="grid gap-4 sm:grid-cols-2">
            {pricingPacks.map((pack) => (
              <li
                key={pack.id}
                className="rounded-[var(--radius-card)] border border-line bg-white p-6 shadow-card"
              >
                <p className="text-eyebrow text-muted">{pack.name} pack</p>
                <p className="mt-3 text-[2rem] font-extrabold leading-none tracking-[-0.04em] text-ink tabular-nums">
                  {formatPrice(pack.price)}
                </p>
                <p className="mt-2 text-[0.875rem] text-muted">
                  <span className="font-semibold text-ink-soft tabular-nums">
                    {pack.credits} credits
                  </span>{" "}
                  · one-time
                </p>
              </li>
            ))}
          </ul>
          <div>
            <p className="text-[1rem] leading-[1.7] text-muted-strong">
              {pricingNotes.commitment}
            </p>
            <p className="mt-3 text-[0.9375rem] leading-[1.65] text-muted">
              {pricingNotes.rates}
            </p>
            <Button asChild className="mt-6" variant="primary">
              <Link href={routes.pricing}>Compare both packs</Link>
            </Button>
          </div>
        </div>
      </Section>

      <UseCaseGrid />

      <Section tone="canvas" space="md" divider>
        <div className="grid gap-6 rounded-[var(--radius-card)] border border-line bg-surface px-6 py-7 sm:flex-row sm:items-center sm:justify-between lg:flex">
          <p className="max-w-[42rem] text-[1rem] leading-[1.65] text-muted-strong">
            Pixelise does not publish performance guarantees or comparative
            savings claims. The product is the workflow, the three styles and the
            price of a pack — all of which are documented here.
          </p>
          <Button asChild variant="secondary">
            <Link href={routes.faq}>Read the FAQ</Link>
          </Button>
        </div>
      </Section>

      <FinalCta />
      <JsonLd
        data={breadcrumbSchema([
          { label: "Home", href: routes.home },
          { label: "Features", href: routes.features },
        ])}
      />
    </>
  );
}
