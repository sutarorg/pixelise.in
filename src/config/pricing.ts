/**
 * Real business configuration — not mock data.
 * The two credit packs are the only products Pixelise sells. Both are
 * one-time purchases. No subscriptions, no bonus credits, no extra tiers.
 */

export type PricingPackId = "creator" | "studio";

export type PricingPack = {
  id: PricingPackId;
  name: string;
  /** Whole rupees. */
  price: number;
  currency: "INR";
  credits: number;
  paymentType: "one-time";
  summary: string;
  bestFor: string;
  highlighted: boolean;
  badge?: string;
  features: readonly string[];
  ctaLabel: string;
};

export const pricingPacks: readonly PricingPack[] = [
  {
    id: "creator",
    name: "Creator",
    price: 499,
    currency: "INR",
    credits: 150,
    paymentType: "one-time",
    summary: "A small pack for a handful of products and a first round of styles.",
    bestFor: "Product ranges you are testing or refreshing.",
    highlighted: false,
    features: [
      "150 credits for studio, lifestyle and advertising visuals",
      "Every photography style in the studio",
      "One-time purchase — no subscription, no auto-renewal",
      "Built for listings, marketplaces, ads and social",
    ],
    ctaLabel: "Get started with Creator",
  },
  {
    id: "studio",
    name: "Studio",
    price: 999,
    currency: "INR",
    credits: 350,
    paymentType: "one-time",
    summary: "The pack most catalogues need: more products, more scenes, one payment.",
    bestFor: "A full catalogue refresh or a seasonal campaign.",
    highlighted: true,
    badge: "Most popular",
    features: [
      "350 credits for studio, lifestyle and advertising visuals",
      "Every photography style in the studio",
      "Lower cost per credit than Creator",
      "One-time purchase — no subscription, no auto-renewal",
    ],
    ctaLabel: "Get started with Studio",
  },
] as const;

export const pricingNotes = {
  commitment:
    "Both packs are one-time purchases. Pixelise does not sell monthly plans and nothing renews automatically.",
  credits:
    "Credits are spent as you generate visuals in the studio. Your balance sits in your account until you use it.",
  rates:
    "Every pack lists exactly what you are buying here. The number of credits a generation uses is shown in the studio, next to the style you pick, before anything is spent.",
} as const;

/** Rupee formatting used by pricing UI and structured data. */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);
}

/** Cost per credit in paise — used for the honest "lower cost per credit" line. */
export function costPerCredit(pack: PricingPack): number {
  return Math.round((pack.price / pack.credits) * 100);
}

export function getPack(id: PricingPackId): PricingPack {
  const pack = pricingPacks.find((item) => item.id === id);
  if (!pack) throw new Error(`Unknown pricing pack: ${id}`);
  return pack;
}
