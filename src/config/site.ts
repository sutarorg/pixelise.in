/**
 * Single source of truth for site identity, URLs and conversion destinations.
 *
 * `NEXT_PUBLIC_APP_URL` is the studio application (accounts, credits, rendering).
 * It is delivered in a later stage of the Pixelise build. Until it is set, every
 * conversion CTA resolves to the on-site `/get-started` page so that no link on
 * the public site is dead and no backend behaviour is simulated.
 */

const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") || null;

export const siteConfig = {
  name: "Pixelise",
  legalName: "Pixelise",
  tagline: "Transform ordinary product photos into extraordinary visuals.",
  description:
    "Pixelise is an AI product photography studio for ecommerce. Upload a product photo and create professional studio, lifestyle and advertising visuals without arranging a photoshoot.",
  locale: "en_IN",
  language: "en-IN",
  url: process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") || "https://pixelise.in",
  /** Published while the market is India-first. Used for structured data only. */
  areaServed: "IN",
  currency: "INR",
  socialImage: "/opengraph-image",
  /** Year shown in the footer. Set from the build, not from a runtime clock. */
  copyrightYear: 2026,
} as const;

export const links = {
  /** True when the studio app is configured in the environment. */
  appConnected: Boolean(appUrl),
  appStudio: appUrl ?? "/get-started",
  /* The account pages ship in this app, so these are always same-origin routes
     (they resolve under the configured app URL in production either way). */
  login: "/login",
  signup: "/signup",
  /** Where every "Get started" CTA points. */
  getStarted: "/get-started",
  examples: "/examples",
  pricing: "/pricing",
  contact: "/contact",
} as const;

export const routes = {
  home: "/",
  features: "/features",
  examples: "/examples",
  howItWorks: "/how-it-works",
  pricing: "/pricing",
  faq: "/faq",
  blog: "/blog",
  contact: "/contact",
  getStarted: "/get-started",
  privacy: "/privacy",
  terms: "/terms",
  refund: "/refund-policy",
} as const;

export type SiteRoute = keyof typeof routes;
