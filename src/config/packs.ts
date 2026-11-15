/**
 * The two credit packs Pixelise sells.
 *
 * These are business facts for this release, not configurable content:
 * Creator ₹499 / 150 credits and Studio ₹999 / 350 credits, one-time only.
 * The backend uses this table as the authoritative source of price and credits —
 * a request may name a pack id, never an amount. Every payment stores a snapshot
 * of the name, amount and credits so a future price change cannot rewrite history.
 *
 * This module is imported by both the server and the client, so it must stay
 * free of `server-only` and of any provider secret.
 */

import type { CreditPack } from "@/lib/api/types";

export type PackId = "creator" | "studio";

export interface PackDefinition {
  id: PackId;
  name: string;
  pricePaise: number;
  credits: number;
  currency: "INR";
  purchaseType: "one-time";
  highlighted: boolean;
  badge: string | null;
  description: string;
  includes: string[];
}

export const PACKS: readonly PackDefinition[] = [
  {
    id: "creator",
    name: "Creator",
    pricePaise: 49_900,
    credits: 150,
    currency: "INR",
    purchaseType: "one-time",
    highlighted: false,
    badge: null,
    description: "A small pack for a handful of products and a first round of styles.",
    includes: [
      "150 credits for studio, lifestyle and advertising visuals",
      "Every photography style in the studio",
      "One-time purchase — no subscription, no auto-renewal",
    ],
  },
  {
    id: "studio",
    name: "Studio",
    pricePaise: 99_900,
    credits: 350,
    currency: "INR",
    purchaseType: "one-time",
    highlighted: true,
    badge: "Most popular",
    description: "The pack most catalogues need: more products, more scenes, one payment.",
    includes: [
      "350 credits for studio, lifestyle and advertising visuals",
      "Every photography style in the studio",
      "Lower cost per credit than Creator",
    ],
  },
] as const;

export function getPack(id: string): PackDefinition | null {
  return PACKS.find((pack) => pack.id === id) ?? null;
}

/** The shape the customer app consumes (`GET /api/v1/credits/packs`). */
export function packsForClient(): CreditPack[] {
  return PACKS.map((pack) => ({
    id: pack.id,
    name: pack.name,
    pricePaise: pack.pricePaise,
    currency: pack.currency,
    credits: pack.credits,
    purchaseType: pack.purchaseType,
    highlighted: pack.highlighted,
    badge: pack.badge,
    description: pack.description,
    includes: pack.includes,
  }));
}

/** Maximum allowed lifetime of a Razorpay order before we stop honouring it. */
export const ORDER_TTL_MINUTES = 30;
