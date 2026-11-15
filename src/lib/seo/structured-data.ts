import { pricingPacks } from "@/config/pricing";
import { siteConfig, routes } from "@/config/site";
import { blogConfig } from "@/config/blog";
import type { FaqItem } from "@/config/content";

const blogPath = blogConfig.path;

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

/**
 * Blog index structured data.
 *
 * `Blog` describes the journal itself; the `blogPost` list gives crawlers the current
 * table of contents. No `aggregateRating`, no view counts, nothing that is not visible
 * on the page.
 */
export function blogSchema(posts: readonly { slug: string; title: string; description: string; publishedAt: string; cover: { src: string } }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": `${siteConfig.url}${blogPath}#blog`,
    name: "The Pixelise Journal",
    description:
      "Practical product photography guides for ecommerce sellers, researched against primary platform documentation.",
    url: `${siteConfig.url}${blogPath}`,
    inLanguage: siteConfig.language,
    publisher: { "@id": `${siteConfig.url}/#organization` },
    blogPost: posts.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      description: post.description,
      url: `${siteConfig.url}${blogPath}/${post.slug}`,
      datePublished: post.publishedAt,
      image: `${siteConfig.url}${post.cover.src}`,
    })),
  };
}

type BlogPostingInput = {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  updatedAt: string;
  categoryLabel: string;
  keywords: readonly string[];
  cover: { src: string; width: number; height: number; alt: string };
  wordCount: number;
};

export function blogPostingSchema(post: BlogPostingInput) {
  const url = `${siteConfig.url}${blogPath}/${post.slug}`;

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    headline: post.title,
    description: post.description,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    inLanguage: siteConfig.language,
    articleSection: post.categoryLabel,
    keywords: post.keywords.join(", "),
    wordCount: post.wordCount,
    image: {
      "@type": "ImageObject",
      url: `${siteConfig.url}${post.cover.src}`,
      width: post.cover.width,
      height: post.cover.height,
      caption: post.cover.alt,
    },
    // An organisational byline. No invented person, credentials or reviewer.
    author: {
      "@type": "Organization",
      name: "Pixelise Editorial Team",
      url: `${siteConfig.url}${blogPath}`,
    },
    publisher: { "@id": `${siteConfig.url}/#organization` },
    isPartOf: { "@id": `${siteConfig.url}${blogPath}#blog` },
  };
}
