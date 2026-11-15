import { pricingPacks } from "@/config/pricing";
import { siteConfig, routes } from "@/config/site";
import type { FaqItem } from "@/config/content";

/**
 * Structured data follows Google Search Central's policies: only facts that
 * appear on the page, no invented ratings, reviews or customer counts.
 */

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteConfig.url}/#organization`,
    name: siteConfig.name,
    alternateName: "Pixelise AI Product Photography Studio",
    url: siteConfig.url,
    logo: {
      "@type": "ImageObject",
      url: `${siteConfig.url}/icon.svg`,
    },
    description: siteConfig.description,
    areaServed: { "@type": "Country", name: "India" },
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteConfig.url}/#website`,
    url: siteConfig.url,
    name: siteConfig.name,
    description: siteConfig.description,
    inLanguage: siteConfig.language,
    publisher: { "@id": `${siteConfig.url}/#organization` },
  };
}

export function softwareApplicationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${siteConfig.url}/#software`,
    name: siteConfig.name,
    applicationCategory: "BusinessApplication",
    applicationSubCategory: "AI product photography",
    operatingSystem: "Web browser",
    url: siteConfig.url,
    description:
      "AI product photography studio for ecommerce. Create studio, lifestyle and advertising product visuals from a product photo.",
    featureList: [
      "Studio product photography",
      "Lifestyle product photography",
      "Advertising product imagery",
      "Credit-based one-time pricing",
    ],
    offers: pricingPacks.map((pack) => ({
      "@type": "Offer",
      name: `${pack.name} pack`,
      description: `${pack.credits} credits, one-time purchase`,
      price: pack.price,
      priceCurrency: pack.currency,
      url: `${siteConfig.url}${routes.pricing}#${pack.id}`,
      category: "One-time credit pack",
    })),
    publisher: { "@id": `${siteConfig.url}/#organization` },
  };
}

export function breadcrumbSchema(items: readonly { label: string; href: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: `${siteConfig.url}${item.href}`,
    })),
  };
}

export function faqSchema(items: readonly Pick<FaqItem, "question" | "answer">[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}
