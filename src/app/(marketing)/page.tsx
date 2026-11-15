import type { Metadata } from "next";

import { Hero } from "@/components/marketing/hero";
import { AudienceStrip } from "@/components/marketing/audience-strip";
import { FeatureGrid } from "@/components/marketing/feature-grid";
import { StylesShowcase } from "@/components/marketing/styles-showcase";
import { ProcessSteps } from "@/components/marketing/process-steps";
import { UseCaseGrid } from "@/components/marketing/use-case-grid";
import { PricingSection } from "@/components/marketing/pricing-section";
import { FaqSection } from "@/components/marketing/faq-section";
import { FinalCta } from "@/components/marketing/final-cta";
import { JsonLd } from "@/components/shared/json-ld";
import { faqs, homeFaqIds } from "@/config/content";
import { pageMetadata } from "@/lib/seo/metadata";
import { faqSchema, softwareApplicationSchema } from "@/lib/seo/structured-data";

export const metadata: Metadata = pageMetadata({
  // Approved brand title. Fixed with `absoluteTitle` so the root template does not
  // append "| Pixelise" — the homepage title is a brand decision, not a page name.
  title: "AI Product Photography to Boost Sales Online",
  absoluteTitle: true,
  description:
    "Create studio, lifestyle and advertising product photos with AI. Upload a product photo, pick a style and get ecommerce-ready visuals. Packs from ₹499.",
  path: "/",
  keywords: [
    "AI product photography",
    "AI product photo generator",
    "AI product photography studio",
    "ecommerce product photography",
    "Shopify product photography",
  ],
});

export default function HomePage() {
  const homeFaqs = faqs.filter((faq) => (homeFaqIds as readonly string[]).includes(faq.id));

  return (
    <>
      <Hero />
      <AudienceStrip />
      <FeatureGrid />
      <StylesShowcase />
      <ProcessSteps />
      <UseCaseGrid />
      <PricingSection />
      <FaqSection />
      <FinalCta />
      <JsonLd data={[softwareApplicationSchema(), faqSchema(homeFaqs)]} />
    </>
  );
}
