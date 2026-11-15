/**
 * All marketing copy that is reused across pages lives here so that the public
 * site, and later the in-app surfaces, read from one source.
 * Nothing in this file is placeholder copy: every line is published product copy.
 */

export type PhotographyStyleId = "studio" | "lifestyle" | "advertising";

export type PhotographyStyle = {
  id: PhotographyStyleId;
  name: string;
  shortLabel: string;
  headline: string;
  summary: string;
  detail: string;
  image: ImageKey;
  alt: string;
  ctaLabel: string;
};

import type { MarketingImageKey } from "@/config/images";

/** Image keys are resolved through the generated src/config/images.ts manifest. */
type ImageKey = MarketingImageKey;

export const audienceCategories = [
  "D2C brands",
  "Shopify stores",
  "Marketplace sellers",
  "Creative agencies",
] as const;

export const heroBenefits = [
  "No photography skills needed.",
  "Save time and money.",
  "Professional product visuals.",
] as const;

export const photographyStyles: readonly PhotographyStyle[] = [
  {
    id: "studio",
    name: "Studio",
    shortLabel: "Studio",
    headline: "Clean studio light, built around your product",
    summary:
      "Neutral seamless backdrops, soft directional light and a believable contact shadow — the shot an ecommerce listing needs first.",
    detail:
      "Studio is the foundation style: a controlled backdrop, one clearly motivated key light and enough falloff to keep the product reading as an object rather than a cut-out. Use it for the primary image on a product page, for marketplace requirements and for catalogue grids that have to sit together.",
    image: "styleStudio",
    alt: "Frosted skincare bottle photographed on a warm off-white studio backdrop with a soft contact shadow",
    ctaLabel: "Start with Studio",
  },
  {
    id: "lifestyle",
    name: "Lifestyle",
    shortLabel: "Lifestyle",
    headline: "Real light, real surfaces, believable context",
    summary:
      "Travertine, linen, stone and a window's worth of daylight — the product placed in a room instead of on a sweep.",
    detail:
      "Lifestyle puts the product in a set: a surface with texture, props held back so they never compete, and directional daylight with long shadows. It is the style for campaign banners, category headers, social and any placement where the product has to look lived with.",
    image: "styleLifestyle",
    alt: "Frosted skincare bottle on a travertine block with eucalyptus, a river stone and linen in warm window light",
    ctaLabel: "Start with Lifestyle",
  },
  {
    id: "advertising",
    name: "Advertising",
    shortLabel: "Advertising",
    headline: "Editorial lighting with somewhere to put your headline",
    summary:
      "Hard key light, deep shadow and a controlled violet accent — imagery that carries a promotion, not just a product.",
    detail:
      "Advertising is the dramatic style: a darker set, a hard motivated key, a rim light that separates the product from the background and negative space set aside for type. Use it for paid social, launch campaigns and hero banners where the image has to stop a scroll.",
    image: "styleAdvertising",
    alt: "Frosted skincare bottle on dark polished stone with a violet rim light and a hard sculptural shadow",
    ctaLabel: "Start with Advertising",
  },
] as const;

export type Feature = {
  id: string;
  title: string;
  summary: string;
  detail: string;
};

export const features: readonly Feature[] = [
  {
    id: "quality",
    title: "Professional quality",
    summary:
      "Believable light, shadow and reflection around the product you actually photographed.",
    detail:
      "Every render keeps the object — its proportions, label, colour and finish — and rebuilds only the scene around it. That is what stops a product photo looking generated: the glass still refracts, the metal still has one clean specular line, and the shadow on the surface still connects to the base.",
  },
  {
    id: "styles",
    title: "Multiple photography styles",
    summary:
      "Studio, lifestyle and advertising looks from one source photo, without a second shoot.",
    detail:
      "A catalogue needs more than one image per product. Pixelise treats Studio, Lifestyle and Advertising as three distinct lighting and set decisions rather than three filters, so a single upload can cover a product page, a category banner and a paid campaign.",
  },
  {
    id: "speed",
    title: "Fast AI generation",
    summary:
      "No studio booking, no courier, no waiting for a photographer's calendar.",
    detail:
      "The slow part of product photography is not the camera, it is the logistics: samples, sets, props, a photographer, a retoucher and a second round when the label changed. With Pixelise the source photo is the only thing you need to prepare.",
  },
  {
    id: "cost",
    title: "Cost-effective visual creation",
    summary:
      "Buy credits once and spend them when a product needs a new scene.",
    detail:
      "Pixelise is sold in credit packs, not monthly plans. You pay once for 150 or 350 credits and use them across products and styles as your catalogue changes, so there is no subscription sitting idle between launches.",
  },
] as const;

export type ProcessStep = {
  number: string;
  title: string;
  summary: string;
  detail: string;
};

export const processSteps: readonly ProcessStep[] = [
  {
    number: "01",
    title: "Upload your product photo",
    summary:
      "A clear phone photo on a plain surface is enough to start. The product stays yours.",
    detail:
      "Shoot the product straight on, fill the frame, keep the label legible and avoid harsh reflections on glass. Nothing needs to be cut out by hand — the source photo is the reference for shape, colour and finish.",
  },
  {
    number: "02",
    title: "Choose your photography style",
    summary:
      "Studio, Lifestyle or Advertising, plus the set and lighting direction you want.",
    detail:
      "Pick the style that matches where the image will be used. Studio for the product page, Lifestyle for category and campaign imagery, Advertising for paid placements that need drama and room for type.",
  },
  {
    number: "03",
    title: "Let AI create your visuals",
    summary:
      "Pixelise renders the scene around your product and keeps the product intact.",
    detail:
      "The studio builds the backdrop, light, surface and props around your product rather than inventing a new one. Review the result, adjust the direction and generate again if the set is not right — each generation uses credits from your balance.",
  },
  {
    number: "04",
    title: "Download and use your images",
    summary:
      "Take the finished visuals into your product pages, marketplaces, ads and social.",
    detail:
      "Export the images you want at the size your placement needs, then use them wherever the product appears: the product page, marketplace listings, paid social, catalogues and campaign pages.",
  },
] as const;

export type UseCase = {
  id: string;
  category: string;
  title: string;
  summary: string;
  image: ImageKey;
  alt: string;
};

export const useCases: readonly UseCase[] = [
  {
    id: "beauty",
    category: "Beauty & skincare",
    title: "Glass, gel and labels that stay honest",
    summary:
      "Serums and creams keep their real translucency, dropper caps keep their specular line, and the label stays square to the camera.",
    image: "usecaseBeauty",
    alt: "Frosted skincare bottle on a travertine block with eucalyptus leaves and a river stone",
  },
  {
    id: "fashion",
    category: "Fashion & accessories",
    title: "Small leather goods, photographed as objects",
    summary:
      "Bags, belts and footwear read as solid objects with weight, grain and hardware — not flat-lay cut-outs.",
    image: "usecaseFashion",
    alt: "Tan leather crossbody bag with brass hardware on a warm grey studio backdrop",
  },
  {
    id: "jewellery",
    category: "Jewellery",
    title: "Metal and stone under controlled highlights",
    summary:
      "Facets and settings need light you can aim. Highlights are placed so detail survives compression on a phone screen.",
    image: "usecaseJewellery",
    alt: "Gold signet ring with a square emerald on dark polished stone with a reflection",
  },
  {
    id: "food",
    category: "Food & packaging",
    title: "Packaging rendered as packaging",
    summary:
      "Kraft, foil and print finishes keep their texture so the pack in the image is the pack that arrives.",
    image: "usecaseFood",
    alt: "Kraft coffee pouch with a blank label on a sand surface with roasted beans",
  },
  {
    id: "home",
    category: "Home & lifestyle",
    title: "Quiet sets that keep the product first",
    summary:
      "Warm plaster, oak and textiles give candles and ceramics context without turning the frame into a mood board.",
    image: "usecaseHome",
    alt: "Amber glass candle with a blank label on an oak block with linen and dried grass",
  },
] as const;

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
  group: "Getting started" | "Credits & packs" | "Images & usage" | "Support";
};

export const faqs: readonly FaqItem[] = [
  {
    id: "what-is-pixelise",
    question: "What is Pixelise?",
    answer:
      "Pixelise is an AI product photography studio. You upload a photo of your product and create studio, lifestyle and advertising visuals from it — without booking a studio, a photographer or a set.",
    group: "Getting started",
  },
  {
    id: "how-it-works",
    question: "How does AI product photography work?",
    answer:
      "Your photo gives the studio the object: its shape, label, colour and finish. Pixelise then builds a photographic scene around that object — backdrop, surface, light and props — and renders the result so the image still shows your product, not an approximation of it.",
    group: "Getting started",
  },
  {
    id: "image-types",
    question: "What types of product images can I create?",
    answer:
      "Three families of visuals: studio shots on clean neutral backdrops, lifestyle scenes with natural light and props, and advertising images with dramatic editorial lighting. The studio is built for beauty, fashion, jewellery, packaged food and home products.",
    group: "Getting started",
  },
  {
    id: "experience",
    question: "Do I need photography experience?",
    answer:
      "No. A clear phone photo of the product on a plain surface is the starting point. You choose the style; the studio handles the backdrop, the light and the composition.",
    group: "Getting started",
  },
  {
    id: "credits",
    question: "How do Pixelise credits work?",
    answer:
      "Credits are what you spend when you create visuals in the studio. You buy a pack once and the credits sit in your balance, spent as you generate. There is no monthly subscription and nothing renews automatically.",
    group: "Credits & packs",
  },
  {
    id: "pack-difference",
    question: "What is the difference between the Creator and Studio packs?",
    answer:
      "Creator is ₹499 for 150 credits. Studio is ₹999 for 350 credits. Both are one-time purchases with the same studio and the same photography styles; Studio simply gives you more credits at a lower cost per credit.",
    group: "Credits & packs",
  },
  {
    id: "one-time",
    question: "Are these one-time purchases?",
    answer:
      "Yes. You pay once for a pack of credits. Pixelise does not sell monthly plans, and no pack renews automatically.",
    group: "Credits & packs",
  },
  {
    id: "usage",
    question: "Can I use images for ecommerce listings and advertising?",
    answer:
      "The visuals are made to be used in ecommerce listings, marketplaces, advertising and social. The terms that apply to that use are set out in our Terms of Service. If a campaign needs specific rights confirmed in writing, contact support before you publish.",
    group: "Images & usage",
  },
  {
    id: "support",
    question: "How do I contact support?",
    answer:
      "Use the contact page. Questions about a pack, a credit balance or an image all go to the same place, and we reply to the email address you write from.",
    group: "Support",
  },
] as const;

/** Home page shows the six questions that carry the most buying weight. */
export const homeFaqIds = [
  "what-is-pixelise",
  "how-it-works",
  "credits",
  "pack-difference",
  "one-time",
  "experience",
] as const;

export function getFaq(id: (typeof faqs)[number]["id"]): FaqItem {
  const item = faqs.find((faq) => faq.id === id);
  if (!item) throw new Error(`Unknown FAQ: ${id}`);
  return item;
}
