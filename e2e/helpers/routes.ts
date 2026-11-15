/** Routes and viewports shared by the suites. Keep in sync with src/config/site.ts. */

export const publicRoutes = [
  { path: "/", heading: "AI product photography" },
  { path: "/features", heading: "features" },
  { path: "/examples", heading: "examples" },
  { path: "/how-it-works", heading: "how" },
  { path: "/pricing", heading: "pricing" },
  { path: "/faq", heading: "FAQ" },
  { path: "/contact", heading: "contact" },
  { path: "/get-started", heading: "start" },
  { path: "/privacy", heading: "privacy" },
  { path: "/terms", heading: "terms" },
  { path: "/refund-policy", heading: "refund" },
  { path: "/blog", heading: "journal" },
] as const;

/** Pages rendered inside the authenticated shell. */
export const appRoutes = [
  "/dashboard",
  "/studio",
  "/creations",
  "/credits",
  "/transactions",
  "/settings",
  "/help",
] as const;

export const adminRoutes = ["/admin", "/admin/users", "/admin/payments", "/admin/settings"] as const;

export const articleSlugs = [
  "ai-product-photography-ecommerce-guide",
  "shopify-product-photography-guide",
  "amazon-product-image-guide",
  "diy-product-photography-small-business",
  "product-lifestyle-photography-guide",
  "studio-vs-lifestyle-product-photography",
  "skincare-product-photography-guide",
  "jewellery-product-photography-guide",
  "fashion-product-photography-guide",
  "food-product-photography-guide",
  "product-photography-background-guide",
  "ecommerce-ad-creatives-product-photography",
] as const;

export const categorySlugs = [
  "ai-product-photography",
  "ecommerce-photography",
  "product-photography-guides",
  "advertising-marketing",
] as const;

export const viewports = [
  { label: "360", width: 360, height: 780 },
  { label: "390", width: 390, height: 844 },
  { label: "768", width: 768, height: 1024 },
  { label: "1024", width: 1024, height: 768 },
  { label: "1280", width: 1280, height: 800 },
  { label: "1440", width: 1440, height: 900 },
] as const;

/** Routes checked for horizontal overflow and tap-target size at every viewport. */
export const responsiveRoutes = ["/", "/pricing", "/blog", "/blog/ai-product-photography-ecommerce-guide"] as const;
