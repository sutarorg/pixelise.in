import { defaultScenes, defaultStyles } from "@/config/studio";

/**
 * Prompt construction.
 *
 * Three rules drive every template:
 *
 *  1. The product is the subject. The model is asked to change the world around
 *     it, never to redesign it.
 *  2. Identity is explicit: shape, proportions, colour, label text, typography,
 *     logo placement and packaging construction are listed as things that must not
 *     change. This is a request to a generative model, not a guarantee — and the
 *     product never claims otherwise ("100% accuracy" appears nowhere in this
 *     codebase).
 *  3. Negative constraints are stated positively ("keep the label text exactly as
 *     printed") because that is what the model responds to best.
 *
 * The builder is pure: same inputs, same prompt. That is what makes it testable.
 */

const identityRules = [
  "Preserve the product's exact silhouette, proportions and cap or closure shape.",
  "Preserve the original packaging material, finish and print layout.",
  "Keep every label word, number and typography style exactly as printed — do not rewrite, translate, embellish or invent text.",
  "Keep the logo, its position, size and colour unchanged.",
  "Keep the product's colour values unchanged apart from realistic light and reflection.",
  "Do not add competing products, extra props that obscure the product, price tags or promotional text.",
].join(" ");

const styleDirections: Record<string, string> = {
  studio:
    "Photograph the product in a clean commercial studio: seamless background, controlled soft key light, gentle gradient falloff, crisp contact shadow, no props unless they support scale.",
  lifestyle:
    "Place the product in a believable real-world setting where it would naturally be used, with natural daylight, honest materials and a shallow depth of field that keeps the product sharp.",
  advertising:
    "Compose a premium advertising key visual: confident lighting, rich but believable colour grading, deliberate negative space for future typography, and a product that reads instantly at thumbnail size.",
};

/**
 * Scene direction, keyed by the scene ids the studio actually offers
 * (`src/config/studio.ts`). An unknown id falls back to the style direction
 * rather than inventing a set.
 */
const sceneDirections: Record<string, string> = {
  "minimal-white-studio": "on a seamless white sweep with a soft floor shadow",
  "beige-luxury-studio": "on a warm beige backdrop with subtle paper texture and soft directional light",
  "natural-botanical": "among soft green foliage and natural daylight, with the plant shapes staying behind the product",
  "warm-wooden-surface": "on a warm wooden surface with visible grain and a gentle reflected highlight",
  "luxury-marble-setup": "on a pale marble surface with natural veining and a controlled reflected highlight",
  "premium-dramatic-lighting": "against a deep charcoal backdrop with a single hard key light and dramatic falloff",
};

export interface PromptInput {
  styleId: string;
  sceneId?: string | null;
  aspectRatio: string;
  productDescription?: string | null;
}

export interface BuiltPrompt {
  prompt: string;
  negativePrompt: string | null;
}

export function buildPrompt(input: PromptInput): BuiltPrompt {
  const style = defaultStyles.find((item) => item.id === input.styleId);
  const styleDirection =
    styleDirections[input.styleId] ??
    `Photograph the product in a ${style?.name?.toLowerCase() ?? "commercial"} treatment.`;

  const sceneDirection = input.sceneId ? sceneDirections[input.sceneId] : undefined;

  const subject = input.productDescription?.trim()
    ? `The product shown in the input image (${input.productDescription.trim()}).`
    : "The product shown in the input image.";

  const parts = [
    `Retouch and re-stage ${subject}`,
    styleDirection,
    sceneDirection ? `Set the scene ${sceneDirection}.` : "",
    `Frame it for a ${input.aspectRatio} crop with the product fully inside the frame and comfortable margins.`,
    identityRules,
    "Result must look like a real photograph: physically plausible shadows, reflections and perspective. No illustration, no 3D render look, no warped geometry.",
  ].filter(Boolean);

  return {
    prompt: parts.join(" "),
    negativePrompt: null,
  };
}

/**
 * Compact description used in the UI and in logs. Derived from the chosen ids so
 * the customer sees the same words the server used.
 */
export function describePromptChoice(input: { styleId: string; sceneId?: string | null }): string {
  const style = defaultStyles.find((item) => item.id === input.styleId)?.name ?? input.styleId;
  const scene = input.sceneId ? defaultScenes.find((item) => item.id === input.sceneId)?.name : null;
  return scene ? `${style} · ${scene}` : style;
}
