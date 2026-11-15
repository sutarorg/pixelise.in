/**
 * Generation capability + provider parameters.
 *
 * Product-facing choices (styles, scenes, aspect ratios, upload limits) already
 * live in `src/config/studio.ts` and are the single source of truth for both the
 * studio UI and the server. This module adds the parts only the backend needs:
 * which quality ids exist and what they map to in the provider request.
 *
 * Credit prices are NOT here. They live in the `generation_pricing` table and
 * must be approved by the owner before any generation can be charged.
 */

import {
  defaultAspectRatios,
  defaultQualities,
  defaultScenes,
  defaultStyles,
  uploadConstraints,
} from "@/config/studio";

export { defaultAspectRatios, defaultQualities, defaultScenes, defaultStyles, uploadConstraints };

export type QualityId = (typeof defaultQualities)[number]["id"];

export function isKnownStyle(id: string): boolean {
  return defaultStyles.some((style) => style.id === id);
}

export function isKnownQuality(id: string): boolean {
  return defaultQualities.some((quality) => quality.id === id);
}

export function isKnownScene(id: string): boolean {
  return defaultScenes.some((scene) => scene.id === id);
}

export function isKnownAspectRatio(id: string): boolean {
  return defaultAspectRatios.some((ratio) => ratio.id === id);
}

/**
 * Provider parameters per quality.
 *
 * `resolution` is the only documented knob the nano-banana edit endpoints expose
 * for output size ("2K" appears in the model docs). The value a model actually
 * accepts is recorded in `model_configs.output_resolutions`; the router drops the
 * parameter when the model does not list it, instead of sending an unsupported
 * field and getting a 422.
 */
export const qualityProviderParams: Record<string, { resolution?: string }> = {
  standard: {},
  premium: { resolution: "2K" },
};

/** Longest side requested from the provider, used to sanity-check the result. */
export const maxOutputSidePx = 4096;

/** Webhook path the provider calls. Absolutised with `serverEnv.appUrl`. */
export const FAL_WEBHOOK_PATH = "/api/v1/webhooks/fal";
export const RAZORPAY_WEBHOOK_PATH = "/api/v1/webhooks/razorpay";
