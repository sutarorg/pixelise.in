import type { BlogCategorySlug } from "@/config/blog";

export type BlogPostMeta = {
  slug: string;
  title: string;
  /**
   * Meta description and card summary. Unique per article, 120–170 characters,
   * written to describe the article rather than to stuff a phrase.
   */
  description: string;
  /** Short card line (kicker) shown under the title in listings. */
  excerpt: string;
  category: BlogCategorySlug;
  /** Primary phrase first, then supporting phrasing. Used for `keywords` metadata. */
  keywords: readonly string[];
  /** ISO dates. Real publication dates — never backdated to fake freshness. */
  publishedAt: string;
  updatedAt: string;
  cover: {
    src: string;
    alt: string;
    width: number;
    height: number;
  };
  /** Shown first on the blog index. */
  featured?: boolean;
  /** Slugs of the two or three closest articles, in reading order. */
  related: readonly string[];
};

const cover = (slug: string, alt: string) => ({
  src: `/images/blog/${slug}.jpg`,
  alt,
  width: 1600,
  height: 900,
});

/**
 * The journal's table of contents.
 *
 * Bodies live next to this file in `<slug>.md` and are read at build time. Keeping
 * metadata typed here (instead of parsing front-matter) means a missing title, typo'd
 * category or broken related slug fails `npm run typecheck` rather than shipping.
 */
export const blogPosts: readonly BlogPostMeta[] = [
  {
    slug: "ai-product-photography-ecommerce-guide",
    title: "AI Product Photography for Ecommerce: What It Is and When It Helps",
    description:
      "A grounded guide to AI product photography for ecommerce: what the workflow actually does, where generated images hold up, where they fail, and how to review output before it goes on a product page.",
    excerpt:
      "Where AI image generation earns its place in an ecommerce photo workflow — and the product categories where it does not.",
    category: "ai-product-photography",
    keywords: [
      "AI product photography",
      "AI product photography for ecommerce",
      "AI packshots",
      "AI product photo generator",
      "ecommerce product imagery",
    ],
    publishedAt: "2026-11-15",
    updatedAt: "2026-11-15",
    cover: cover(
      "ai-product-photography-ecommerce-guide",
      "Abstract studio scene with a soft light source, a matte pedestal and violet gradients, used as the cover illustration for the AI product photography guide.",
    ),
    featured: true,
    related: ["shopify-product-photography-guide", "studio-vs-lifestyle-product-photography", "product-photography-background-guide"],
  },
  {
    slug: "shopify-product-photography-guide",
    title: "Shopify Product Photography: A Practical Guide for Store Owners",
    description:
      "Shopify image requirements, the square format most themes expect, and a repeatable workflow for shooting or generating product photos that still look right on a collection grid.",
    excerpt:
      "What Shopify expects from product media, and how to build a workflow that survives theme changes and mobile grids.",
    category: "ecommerce-photography",
    keywords: [
      "Shopify product photography",
      "Shopify product image size",
      "Shopify image requirements",
      "Shopify product photos",
    ],
    publishedAt: "2026-11-15",
    updatedAt: "2026-11-15",
    cover: cover(
      "shopify-product-photography-guide",
      "A grid of square product tiles on a green-tinted background, illustrating a Shopify collection layout, in a clean editorial style.",
    ),
    featured: true,
    related: ["amazon-product-image-guide", "product-photography-background-guide", "ai-product-photography-ecommerce-guide"],
  },
  {
    slug: "amazon-product-image-guide",
    title: "Amazon Product Images: A Seller's Guide to Listing Requirements",
    description:
      "How Amazon product images work in practice: main image expectations, secondary image roles, file handling, and how to verify the current rules in Seller Central instead of trusting blog posts.",
    excerpt:
      "The image rules Amazon sellers actually get suppressed for — and why you should read them in Seller Central, not on a blog.",
    category: "ecommerce-photography",
    keywords: [
      "Amazon product images",
      "Amazon product image requirements",
      "Amazon main image",
      "Amazon listing photos",
    ],
    publishedAt: "2026-11-15",
    updatedAt: "2026-11-15",
    cover: cover(
      "amazon-product-image-guide",
      "An orange-lit editorial composition of stacked parcels and a plain product box, suggesting marketplace listings.",
    ),
    related: ["shopify-product-photography-guide", "product-photography-background-guide", "ecommerce-ad-creatives-product-photography"],
  },
  {
    slug: "diy-product-photography-small-business",
    title: "DIY Product Photography for Small Businesses: A Budget-Friendly Workflow",
    description:
      "A realistic DIY product photography setup for small businesses: phone camera settings, window light, cheap diffusion, a printable backdrop and a repeatable editing routine.",
    excerpt:
      "A working photo setup you can build with a phone, a window and about an hour — plus the compromises it involves.",
    category: "product-photography-guides",
    keywords: [
      "DIY product photography",
      "product photography at home",
      "phone product photography",
      "small business product photos",
    ],
    publishedAt: "2026-11-15",
    updatedAt: "2026-11-15",
    cover: cover(
      "diy-product-photography-small-business",
      "A phone on a small tripod aimed at a product on a paper sweep beside a window, in warm daylight.",
    ),
    featured: true,
    related: ["product-photography-background-guide", "studio-vs-lifestyle-product-photography", "shopify-product-photography-guide"],
  },
  {
    slug: "product-lifestyle-photography-guide",
    title: "Product Lifestyle Photography: How to Shoot Products in Context",
    description:
      "Lifestyle product photography explained: choosing a setting that supports the product's use, casting hands and props honestly, and avoiding the stock-photo feel that erodes trust.",
    excerpt:
      "Context sells, but only when the context is plausible. How to plan lifestyle scenes that do not look borrowed.",
    category: "product-photography-guides",
    keywords: [
      "lifestyle product photography",
      "product lifestyle photography",
      "in-context product photos",
      "ecommerce lifestyle images",
    ],
    publishedAt: "2026-11-15",
    updatedAt: "2026-11-15",
    cover: cover(
      "product-lifestyle-photography-guide",
      "A sunlit tabletop scene with a ceramic cup, a linen cloth and greenery, lit from a window.",
    ),
    related: ["studio-vs-lifestyle-product-photography", "diy-product-photography-small-business", "fashion-product-photography-guide"],
  },
  {
    slug: "studio-vs-lifestyle-product-photography",
    title: "Studio vs Lifestyle Product Photography: Choosing What Your Store Needs",
    description:
      "A decision guide to studio and lifestyle product photography: what each type proves to a shopper, how they behave in listings and ads, and how to sequence them on a small budget.",
    excerpt:
      "Two formats, two different jobs. A side-by-side comparison to help you decide what to shoot first.",
    category: "product-photography-guides",
    keywords: [
      "studio vs lifestyle product photography",
      "studio product photography",
      "lifestyle product photography",
      "product photo types",
    ],
    publishedAt: "2026-11-15",
    updatedAt: "2026-11-15",
    cover: cover(
      "studio-vs-lifestyle-product-photography",
      "A split editorial scene: a seamless studio sweep on one side and a lived-in tabletop on the other.",
    ),
    related: ["product-lifestyle-photography-guide", "diy-product-photography-small-business", "ai-product-photography-ecommerce-guide"],
  },
  {
    slug: "skincare-product-photography-guide",
    title: "Skincare Product Photography: A Guide to Clean, Legible, Honest Images",
    description:
      "Skincare photography that keeps labels readable: reflection control on glass and plastic, texture shots that do not misrepresent the formula, and colour accuracy for compliance.",
    excerpt:
      "Glass, gloss and label copy: the three things that decide whether a skincare photo is usable.",
    category: "product-photography-guides",
    keywords: [
      "skincare product photography",
      "cosmetic product photography",
      "beauty product photos",
      "skincare ecommerce images",
    ],
    publishedAt: "2026-11-15",
    updatedAt: "2026-11-15",
    cover: cover(
      "skincare-product-photography-guide",
      "Amber glass dropper bottles and a stone plinth on a warm neutral background, lit with soft directional light.",
    ),
    related: ["jewellery-product-photography-guide", "product-photography-background-guide", "studio-vs-lifestyle-product-photography"],
  },
  {
    slug: "jewellery-product-photography-guide",
    title: "Jewellery Product Photography: Handling Reflections, Scale and Detail",
    description:
      "Jewellery photography is a reflection problem. Learn how to control metal highlights, communicate true scale, and photograph small stones without exaggerating what the buyer will receive.",
    excerpt:
      "Metal reflects everything around it. Here is what to put around it instead of a camera lens.",
    category: "product-photography-guides",
    keywords: [
      "jewellery product photography",
      "jewelry product photography",
      "reflective product photography",
      "small product photography",
    ],
    publishedAt: "2026-11-15",
    updatedAt: "2026-11-15",
    cover: cover(
      "jewellery-product-photography-guide",
      "A gold ring on a dark textured stone with a single soft highlight and a deep background.",
    ),
    related: ["skincare-product-photography-guide", "product-photography-background-guide", "fashion-product-photography-guide"],
  },
  {
    slug: "fashion-product-photography-guide",
    title: "Fashion Product Photography: A Practical Guide to Apparel Images",
    description:
      "Flat lay, ghost mannequin or on-model? A practical guide to apparel photography, fabric rendering, fit accuracy and the image set fashion shoppers expect.",
    excerpt:
      "Apparel images answer two questions: what is it, and how will it sit on a body? Choose the format that answers both.",
    category: "product-photography-guides",
    keywords: [
      "fashion product photography",
      "apparel product photography",
      "clothing product photos",
      "ghost mannequin photography",
    ],
    publishedAt: "2026-11-15",
    updatedAt: "2026-11-15",
    cover: cover(
      "fashion-product-photography-guide",
      "A folded knit garment on a pale surface beside a wooden hanger, shot from above in soft light.",
    ),
    related: ["product-lifestyle-photography-guide", "jewellery-product-photography-guide", "ecommerce-ad-creatives-product-photography"],
  },
  {
    slug: "food-product-photography-guide",
    title: "Food Product Photography: Making Packaged Food Look Fresh",
    description:
      "Packaged food photography without false claims: label-forward packshots, serving suggestions shot honestly, and the freshness cues that actually photograph well.",
    excerpt:
      "Serving suggestions sell food — as long as the photo shows what is really in the pack.",
    category: "product-photography-guides",
    keywords: [
      "food product photography",
      "packaged food photography",
      "food ecommerce images",
      "food product photos",
    ],
    publishedAt: "2026-11-15",
    updatedAt: "2026-11-15",
    cover: cover(
      "food-product-photography-guide",
      "A rustic table with a jar, scattered spices and a linen napkin in warm side light, styled as a food editorial.",
    ),
    related: ["product-lifestyle-photography-guide", "product-photography-background-guide", "diy-product-photography-small-business"],
  },
  {
    slug: "product-photography-background-guide",
    title: "Product Photography Backgrounds: A Practical Selection Guide",
    description:
      "Seamless paper, vinyl sweeps, textured surfaces or a real environment: how to choose a product photography background that flatters the product and stays consistent across a catalogue.",
    excerpt:
      "Backgrounds are a system, not a mood. How to pick one that scales to a whole catalogue.",
    category: "product-photography-guides",
    keywords: [
      "product photography backgrounds",
      "product backdrop ideas",
      "white background product photography",
      "seamless backdrop",
    ],
    publishedAt: "2026-11-15",
    updatedAt: "2026-11-15",
    cover: cover(
      "product-photography-background-guide",
      "Rolls of seamless paper in sand, grey and violet standing against a studio wall.",
    ),
    related: ["diy-product-photography-small-business", "studio-vs-lifestyle-product-photography", "shopify-product-photography-guide"],
  },
  {
    slug: "ecommerce-ad-creatives-product-photography",
    title: "Product Photography for Ecommerce Ad Creatives: A Practical Brief",
    description:
      "How to shoot or brief product photography for paid ads: safe zones for text, square and vertical crops, movement stills, and the claims your creative must not imply.",
    excerpt:
      "Paid social crops your images to pieces. Shoot for the frame that survives, not the one on your monitor.",
    category: "advertising-marketing",
    keywords: [
      "product photography for ads",
      "ecommerce ad creatives",
      "product photos for social ads",
      "ad creative images",
    ],
    publishedAt: "2026-11-15",
    updatedAt: "2026-11-15",
    cover: cover(
      "ecommerce-ad-creatives-product-photography",
      "Vertical phone-shaped frames showing product crops with bold geometric violet shapes, arranged like ad creative previews.",
    ),
    related: ["fashion-product-photography-guide", "ai-product-photography-ecommerce-guide", "product-lifestyle-photography-guide"],
  },
] as const;
