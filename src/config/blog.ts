/**
 * Blog taxonomy and constants.
 *
 * Categories are real, navigable routes (`/blog/categories/[category]`), not
 * decorative chips. Each has its own indexable page with unique intro copy, so the
 * filter is usable without JavaScript and the label is never a dead control.
 */

export const blogCategories = [
  {
    slug: "ai-product-photography",
    label: "AI Product Photography",
    title: "AI Product Photography",
    description:
      "How AI image generation fits into a real ecommerce photography workflow: what it does well, where it fails, and how to review the output before it reaches a product page.",
  },
  {
    slug: "ecommerce-photography",
    label: "Ecommerce Photography",
    title: "Ecommerce Photography",
    description:
      "Platform-specific image guidance for Shopify, Amazon and marketplace sellers, based on published requirements and the practical constraints of selling online.",
  },
  {
    slug: "product-photography-guides",
    label: "Product Photography Guides",
    title: "Product Photography Guides",
    description:
      "Craft-focused guides: lighting, backgrounds, lifestyle versus studio, and category-specific advice for skincare, jewellery, fashion and packaged food.",
  },
  {
    slug: "advertising-marketing",
    label: "Advertising & Marketing",
    title: "Advertising & Marketing",
    description:
      "Turning product photography into advertising creative that survives cropping, captions and review — without overstating what imagery alone can do.",
  },
] as const;

export type BlogCategorySlug = (typeof blogCategories)[number]["slug"];

export const blogCategorySlugs = blogCategories.map((category) => category.slug);

export function isBlogCategory(value: string): value is BlogCategorySlug {
  return blogCategorySlugs.includes(value as BlogCategorySlug);
}

export function getBlogCategory(slug: BlogCategorySlug) {
  const category = blogCategories.find((item) => item.slug === slug);
  if (!category) throw new Error(`Unknown blog category: ${slug}`);
  return category;
}

/** Author of record. An organisational byline, never a fabricated person. */
export const blogAuthor = {
  name: "Pixelise Editorial Team",
  description:
    "The Pixelise Editorial Team writes about product photography, ecommerce imagery and the practical limits of AI-generated visuals. Articles are researched against primary platform documentation and reviewed before publication.",
  /** schema.org type. An organization, because no individual byline is claimed. */
  type: "Organization",
} as const;

export const blogConfig = {
  path: "/blog",
  title: "The Pixelise Journal",
  eyebrow: "THE PIXELISE JOURNAL",
  headline: "Better product photography starts with better ideas.",
  description:
    "Practical guides to product photography for ecommerce: platform requirements, lighting and backgrounds, category-specific advice, and where AI imagery genuinely helps.",
  /** Editorial note shown at the top of every article. Required by the content rules. */
  coverNote:
    "Cover illustrations on this journal are generated in-house with AI image tools and are editorial artwork, not customer results.",
  /** Words per minute used for reading time. */
  wordsPerMinute: 220,
} as const;
