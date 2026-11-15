import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/shared/section-heading";
import { PageHero } from "@/components/marketing/page-hero";
import { MarketingImage } from "@/components/shared/marketing-image";
import { FaqList } from "@/components/marketing/faq-list";
import { FinalCta } from "@/components/marketing/final-cta";
import { JsonLd } from "@/components/shared/json-ld";
import { IconArrowRight } from "@/components/shared/icons";
import { faqs, processSteps } from "@/config/content";
import { pageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema } from "@/lib/seo/structured-data";
import { links, routes } from "@/config/site";

export const metadata: Metadata = pageMetadata({
  title: "How AI Product Photography Works",
  description:
    "Upload a product photo, choose Studio, Lifestyle or Advertising, let the studio build the scene, then download the visuals. The Pixelise workflow in four steps.",
  path: routes.howItWorks,
  keywords: [
    "how AI product photography works",
    "AI product photo workflow",
    "product photo to studio image",
  ],
});

const stepImages = [
  {
    imageKey: "sourceProduct",
    alt: "An ordinary phone photo of a serum bottle on a kitchen counter",
  },
  {
    imageKey: "styleAdvertising",
    alt: "A serum bottle rendered with dramatic advertising lighting",
  },
  {
    imageKey: "heroLifestyle",
    alt: "The same serum bottle in a styled lifestyle scene",
  },
  {
    imageKey: "usecaseFashion",
    alt: "A finished studio visual of a leather bag",
  },
] as const;

const sourcePhotoTips = [
  {
    title: "Fill the frame",
    body: "Stand the product on a plain surface and get close enough that it occupies most of the image. Cropped edges make it harder to read the silhouette.",
  },
  {
    title: "Keep the label legible",
    body: "Shoot straight on rather than at an angle. A label read at an angle is the detail that gives a generated image away.",
  },
  {
    title: "Tame reflections",
    body: "For glass and metal, avoid a hard light source behind the camera. Diffused daylight near a window is the safest starting point.",
  },
] as const;

const placements = [
  "Product pages and collection grids",
  "Marketplace listings",
  "Paid social and display",
  "Catalogue and campaign pages",
] as const;

const workflowFaqs = faqs.filter((faq) =>
  ["how-it-works", "image-types", "experience", "credits"].includes(faq.id),
);

export default function HowItWorksPage() {
  return (
    <>
      <PageHero
        eyebrow="How it works"
        title="Four steps between a phone photo and a finished visual."
        lead="Pixelise does not ask you to describe your product to a model. You upload the product, choose the photographic direction, and the studio builds the scene around it."
        crumbs={[
          { label: "Home", href: routes.home },
          { label: "How it works" },
        ]}
        actions={
          <>
            <Button asChild size="lg">
              <Link href={links.getStarted}>Get started</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href={routes.pricing}>See pack pricing</Link>
            </Button>
          </>
        }
      />

      <Section tone="canvas" space="lg">
        <ol className="flex flex-col gap-14 lg:gap-20">
          {processSteps.map((step, index) => {
            const media = stepImages[index] ?? stepImages[0];
            return (
              <li key={step.number}>
                <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
                  <div className={index % 2 === 1 ? "lg:order-2" : undefined}>
                    <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
                      <MarketingImage
                        imageKey={media.imageKey}
                        alt={media.alt}
                        sizes="(max-width: 1023px) 100vw, 48vw"
                        fill
                      />
                    </div>
                  </div>
                  <div className={index % 2 === 1 ? "lg:order-1" : undefined}>
                    <div className="flex items-center gap-3">
                      <span className="grid size-9 place-items-center rounded-full border border-line-strong bg-white font-mono text-[0.6875rem] font-semibold tabular-nums text-violet-ink">
                        {step.number}
                      </span>
                      <span className="text-eyebrow text-muted">Step {index + 1} of 4</span>
                    </div>
                    <h2 className="text-h2 mt-5 text-ink">{step.title}</h2>
                    <p className="text-lead mt-4 max-w-[34rem] text-muted-strong">
                      {step.summary}
                    </p>
                    <p className="mt-4 max-w-[36rem] text-[0.9375rem] leading-[1.7] text-muted">
                      {step.detail}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </Section>

      <Section tone="surface" space="lg" divider>
        <SectionHeading
          eyebrow="Before you upload"
          title="What makes a good source photo."
          lead="The studio works from what you give it. These three habits solve almost every problem before it starts."
        />
        <ul className="mt-10 grid gap-5 lg:grid-cols-3">
          {sourcePhotoTips.map((tip, index) => (
            <li
              key={tip.title}
              className="rounded-[var(--radius-card)] border border-line bg-white p-6 shadow-card"
            >
              <span className="font-mono text-[0.6875rem] tabular-nums tracking-[0.1em] text-muted/70">
                0{index + 1}
              </span>
              <h3 className="mt-4 text-[1.0625rem] font-bold tracking-[-0.02em] text-ink">
                {tip.title}
              </h3>
              <p className="mt-2 text-[0.9375rem] leading-[1.62] text-muted-strong">
                {tip.body}
              </p>
            </li>
          ))}
        </ul>
      </Section>

      <Section tone="canvas" space="lg" divider>
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <SectionHeading
            eyebrow="After the render"
            title="Where the finished images go."
            lead="Each style is built for a specific placement, so the frame you generate matches the space it has to fill."
          />
          <div>
            <ul className="divide-y divide-line border-y border-line">
              {placements.map((placement) => (
                <li
                  key={placement}
                  className="flex items-center gap-3 py-4 text-[1rem] font-medium text-ink"
                >
                  <IconArrowRight className="size-4 text-violet" />
                  {placement}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="secondary">
                <Link href={routes.examples}>See examples by style</Link>
              </Button>
              <Button asChild>
                <Link href={links.getStarted}>Get started</Link>
              </Button>
            </div>
          </div>
        </div>
      </Section>

      <Section tone="surface" space="lg" divider>
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <SectionHeading
            eyebrow="Workflow questions"
            title="The things people ask before their first upload."
            lead="If your question is not here, the full FAQ covers credits, packs and usage."
          />
          <FaqList items={workflowFaqs} className="border-t border-line" />
        </div>
      </Section>

      <FinalCta />
      <JsonLd
        data={breadcrumbSchema([
          { label: "Home", href: routes.home },
          { label: "How it works", href: routes.howItWorks },
        ])}
      />
    </>
  );
}
