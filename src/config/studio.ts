/**
 * Studio capability seed.
 *
 * WHAT THIS IS
 * -------------
 * The three photography styles are product facts set by the Pixelise brief. The
 * scene families, aspect ratios and quality modes are the *proposed* catalogue
 * that `GET /api/v1/studio/config` must return (see docs/API-CONTRACT.md §4).
 *
 * WHAT THIS IS NOT
 * ----------------
 * It contains no prices and no generated results. Credit costs are authored by
 * the service and are `null` here on purpose, so the UI can never invent a
 * credit rate. When the service is connected its response replaces this seed
 * entirely; nothing in the UI assumes these exact ids.
 */

import type {
  AspectRatioOption,
  PhotographyStyle,
  QualityOption,
  StudioScene,
} from "@/lib/api/types";

import type { MarketingImageKey } from "@/config/images";

/** Branded artwork used when the service does not supply a thumbnail. */
export const styleArtwork: Record<PhotographyStyle["id"], MarketingImageKey> = {
  studio: "styleStudio",
  lifestyle: "styleLifestyle",
  advertising: "styleAdvertising",
};

export const defaultStyles: PhotographyStyle[] = [
  {
    id: "studio",
    name: "Studio",
    summary: "Clean light, controlled background",
    description:
      "Professional lighting on seamless paper or stone, with a believable contact shadow and true-to-life colour.",
    thumbnailUrl: null,
  },
  {
    id: "lifestyle",
    name: "Lifestyle",
    summary: "A real place, carefully styled",
    description:
      "Your product in a believable setting — window light, natural props and surfaces that make sense for the object.",
    thumbnailUrl: null,
  },
  {
    id: "advertising",
    name: "Advertising",
    summary: "Campaign drama, room for copy",
    description:
      "Dramatic key light, coloured rim and negative space composed for headlines, banners and launch creative.",
    thumbnailUrl: null,
  },
];

export const defaultScenes: StudioScene[] = [
  {
    id: "minimal-white-studio",
    name: "Minimal white studio",
    description: "Seamless off-white sweep, one soft key, a single contact shadow.",
    styleIds: ["studio"],
  },
  {
    id: "beige-luxury-studio",
    name: "Beige luxury studio",
    description: "Warm greige backdrop and a slow falloff that flatters glass and metal.",
    styleIds: ["studio", "lifestyle"],
  },
  {
    id: "natural-botanical",
    name: "Natural botanical",
    description: "Travertine, stone and eucalyptus in soft window light.",
    styleIds: ["lifestyle"],
  },
  {
    id: "warm-wooden-surface",
    name: "Warm wooden surface",
    description: "Oiled oak and linen — grounded, everyday, editorial.",
    styleIds: ["lifestyle"],
  },
  {
    id: "luxury-marble-setup",
    name: "Luxury marble setup",
    description: "Veined marble plinth with a controlled reflection.",
    styleIds: ["studio", "advertising"],
  },
  {
    id: "premium-dramatic-lighting",
    name: "Premium dramatic lighting",
    description: "Hard key from the side, coloured rim light, deep shadow.",
    styleIds: ["advertising"],
  },
];

export const defaultAspectRatios: AspectRatioOption[] = [
  {
    id: "1:1",
    label: "1:1",
    width: 1024,
    height: 1024,
    description: "Square · marketplace listings",
  },
  {
    id: "4:5",
    label: "4:5",
    width: 1024,
    height: 1280,
    description: "Portrait · catalogue and feed",
  },
  {
    id: "16:9",
    label: "16:9",
    width: 1280,
    height: 720,
    description: "Landscape · banners and ads",
  },
  {
    id: "9:16",
    label: "9:16",
    width: 720,
    height: 1280,
    description: "Vertical · stories and reels",
  },
];

export const defaultQualities: QualityOption[] = [
  {
    id: "standard",
    label: "Standard",
    description: "Fast, sharp enough for listings and social.",
    /* Server-authored. Never a frontend guess. */
    credits: null,
  },
  {
    id: "premium",
    label: "Premium detail",
    description: "Slower, finer control of reflections and texture.",
    credits: null,
  },
];

/** Contract seed for upload validation, mirrored by the server. */
export const uploadConstraints = {
  maxBytes: 20 * 1024 * 1024,
  acceptedMimeTypes: ["image/jpeg", "image/png", "image/webp"] as const,
  acceptedLabel: "JPG, PNG or WebP · up to 20 MB",
  minDimension: 640,
} as const;

export function isAcceptedMimeType(type: string): boolean {
  return (uploadConstraints.acceptedMimeTypes as readonly string[]).includes(type);
}
