import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Section } from "@/components/layout/section";
import { PageHero } from "@/components/marketing/page-hero";
import { ExamplesGallery } from "@/components/marketing/examples-gallery";
import { FinalCta } from "@/components/marketing/final-cta";
import { JsonLd } from "@/components/shared/json-ld";
import { SectionHeading } from "@/components/shared/section-heading";
import { pageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema } from "@/lib/seo/structured-data";
import { links, routes } from "@/config/site";

export const metadata: Metadata = pageMetadata({
  title: "AI Product Photography Examples",
  description:
    "Browse original Pixelise studio, lifestyle and advertising product photography across beauty, fragrance, fashion, jewellery, food packaging and home.",
  path: routes.examples,
  keywords: [
    "AI product photography examples",
    "AI lifestyle product photography",
    "product advertising image examples",
  ],
});

export default function ExamplesPage() {
  return (
    <>
      <PageHero
        eyebrow="Examples"
        title="The same product, three different photographic decisions."
        lead="Studio, lifestyle and advertising looks across the categories Pixelise is built for. Every image below is original Pixelise studio artwork made for this site — it is not customer work, and it is not presented as a customer result."
        crumbs={[
          { label: "Home", href: routes.home },
          { label: "Examples" },
        ]}
        actions={
          <>
            <Button asChild size="lg">
              <Link href={links.getStarted}>Start with your product</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href={routes.howItWorks}>See the workflow</Link>
            </Button>
          </>
        }
      />

      <Section tone="canvas" space="md">
        <SectionHeading
          eyebrow="Gallery"
          title="Three photographic directions, one studio."
          lead="Filter by the look you need. Each set shows how the same product behaves under different lighting and styling decisions."
        />
        <div className="mt-10">
          <ExamplesGallery />
        </div>
      </Section>

      <Section tone="surface" space="sm" divider>
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-[46rem] text-[0.875rem] leading-[1.65] text-muted-strong">
            These are Pixelise&apos;s own marketing images, generated in the same
            studio you would use. They show art direction and materials — not a
            promise that a specific product will render identically.
          </p>
          <Button asChild variant="secondary" size="md">
            <Link href={routes.features}>See what the studio does</Link>
          </Button>
        </div>
      </Section>

      <FinalCta />
      <JsonLd
        data={breadcrumbSchema([
          { label: "Home", href: routes.home },
          { label: "Examples", href: routes.examples },
        ])}
      />
    </>
  );
}
