import type { MarketingImageKey } from "@/config/images";

export type GalleryStyleId = "studio" | "lifestyle" | "advertising";

export type GalleryItem = {
  id: string;
  image: MarketingImageKey;
  title: string;
  /** Art-direction note shown under the image — never presented as a customer result. */
  description: string;
  category: string;
  style: GalleryStyleId;
  alt: string;
};

/**
 * Pixelise-owned marketing imagery. Every entry was produced for this site as
 * studio artwork; none of it represents a customer's product or a customer result.
 */
export const galleryItems: readonly GalleryItem[] = [
  {
    id: "serum-studio",
    image: "heroStudio",
    title: "Serum bottle, studio",
    description:
      "Warm off-white sweep, one soft key light, a single contact shadow and glass that keeps its refraction.",
    category: "Beauty & skincare",
    style: "studio",
    alt: "Frosted skincare serum bottle on a warm off-white studio backdrop",
  },
  {
    id: "serum-lifestyle",
    image: "heroLifestyle",
    title: "Serum bottle, lifestyle",
    description:
      "Travertine, a river stone and eucalyptus in window light — props held back so the product still leads.",
    category: "Beauty & skincare",
    style: "lifestyle",
    alt: "Frosted skincare serum bottle on travertine with eucalyptus and linen in window light",
  },
  {
    id: "serum-advertising",
    image: "heroAdvertising",
    title: "Serum bottle, advertising",
    description:
      "Hard key from the right, muted violet rim on the left, condensation on the glass and room for a headline.",
    category: "Beauty & skincare",
    style: "advertising",
    alt: "Frosted skincare serum bottle on dark stone with a violet rim light",
  },
  {
    id: "perfume-studio",
    image: "galleryPerfumeStudio",
    title: "Fragrance, studio",
    description:
      "Square-shouldered glass on a pale greige sweep, with a kicker light drawing the corner edges.",
    category: "Fragrance",
    style: "studio",
    alt: "Square glass perfume bottle with a silver cap on a pale greige studio backdrop",
  },
  {
    id: "perfume-advertising",
    image: "galleryPerfumeAdvertising",
    title: "Fragrance, advertising",
    description:
      "Obsidian surface, a violet beam through smoke and a mirror reflection pooled under the bottle.",
    category: "Fragrance",
    style: "advertising",
    alt: "Perfume bottle on black stone with a violet light beam and smoke",
  },
  {
    id: "bag-studio",
    image: "usecaseFashion",
    title: "Leather bag, studio",
    description:
      "Three-quarter angle, brass hardware held to one clean highlight, strap coiled with intent.",
    category: "Fashion & accessories",
    style: "studio",
    alt: "Tan leather crossbody bag with brass hardware on a warm grey studio backdrop",
  },
  {
    id: "ring-advertising",
    image: "usecaseJewellery",
    title: "Signet ring, advertising",
    description:
      "Narrow strip light on the gold, a small light on the emerald, and a reflection that behaves.",
    category: "Jewellery",
    style: "advertising",
    alt: "Gold signet ring with a square emerald on dark stone with a reflection",
  },
  {
    id: "coffee-lifestyle",
    image: "usecaseFood",
    title: "Coffee packaging, lifestyle",
    description:
      "Kraft texture and a sealed edge rendered honestly, with beans scattered to give the pack scale.",
    category: "Food & packaging",
    style: "lifestyle",
    alt: "Kraft coffee pouch with a blank label beside scattered roasted beans",
  },
  {
    id: "candle-lifestyle",
    image: "usecaseHome",
    title: "Candle, lifestyle",
    description:
      "Amber glass and warm plaster with late-afternoon light — a quiet set that keeps the wick in focus.",
    category: "Home & lifestyle",
    style: "lifestyle",
    alt: "Amber glass candle on an oak block with linen and dried grass",
  },
];

export const galleryFilters = [
  { id: "all", label: "All work" },
  { id: "studio", label: "Studio" },
  { id: "lifestyle", label: "Lifestyle" },
  { id: "advertising", label: "Advertising" },
] as const;

export type GalleryFilterId = (typeof galleryFilters)[number]["id"];
