#!/usr/bin/env node
/**
 * Builds the optimised marketing image set from the generated source files in
 * public/images/marketing/raw and writes a typed manifest with intrinsic
 * dimensions plus base64 blur placeholders (prevents layout shift and gives
 * Next/Image a real placeholder).
 *
 * Usage: node scripts/build-assets.mjs
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const RAW = path.join(ROOT, "public/images/marketing/raw");
const OUT = path.join(ROOT, "public/images/marketing");

/** name -> { source, width, height, quality, position, focus } */
const ASSETS = [
  // Hero + transformation set (one product, three lighting decisions)
  { name: "hero-studio", source: "hero-studio.png", width: 1200, height: 1500 },
  { name: "hero-lifestyle", source: "hero-lifestyle.png", width: 1200, height: 1500 },
  { name: "hero-advertising", source: "hero-advertising.png", width: 1200, height: 1500 },
  { name: "source-product", source: "source-product.png", width: 860, height: 1075 },

  // Photography style cards (4:3 crops of the same product)
  { name: "style-studio", source: "hero-studio.png", width: 1440, height: 1080, position: "centre" },
  { name: "style-lifestyle", source: "hero-lifestyle.png", width: 1440, height: 1080 },
  { name: "style-advertising", source: "hero-advertising.png", width: 1440, height: 1080 },

  // Small preview thumbnails used in the hero composition
  { name: "preview-studio", source: "hero-studio.png", width: 640, height: 640 },
  { name: "preview-lifestyle", source: "hero-lifestyle.png", width: 640, height: 640 },
  { name: "preview-advertising", source: "hero-advertising.png", width: 640, height: 640 },

  // Use-case category imagery
  // The beauty frame is a tighter crop of the lifestyle shoot, the way a real
  // shoot delivers several frames from one set-up.
  {
    name: "usecase-beauty",
    source: "hero-lifestyle.png",
    width: 1100,
    height: 1375,
    extract: { left: 0.07, top: 0.08, width: 0.85, height: 0.85 },
  },
  { name: "usecase-fashion", source: "usecase-fashion.png", width: 1100, height: 1375 },
  { name: "usecase-jewellery", source: "usecase-jewellery.png", width: 1100, height: 1375 },
  { name: "usecase-food", source: "usecase-food.png", width: 1100, height: 1375 },
  { name: "usecase-home", source: "usecase-home.png", width: 1100, height: 1375, quality: 76 },

  // Gallery / examples set
  { name: "gallery-perfume-studio", source: "gallery-perfume-studio.png", width: 1100, height: 1375 },
  { name: "gallery-perfume-advertising", source: "gallery-perfume-advertising.png", width: 1100, height: 1375 },
];

async function blurDataUrl(buffer) {
  const out = await sharp(buffer)
    .resize(16, null, { fit: "inside" })
    .webp({ quality: 40 })
    .toBuffer();
  return `data:image/webp;base64,${out.toString("base64")}`;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const manifest = {};
  const missing = [];

  for (const asset of ASSETS) {
    const input = path.join(RAW, asset.source);
    let buffer;
    try {
      buffer = await sharp(input).rotate().toBuffer();
    } catch {
      missing.push(asset.source);
      continue;
    }

    let working = sharp(buffer);
    if (asset.extract) {
      const meta = await sharp(buffer).metadata();
      working = sharp(buffer).extract({
        left: Math.round(meta.width * asset.extract.left),
        top: Math.round(meta.height * asset.extract.top),
        width: Math.round(meta.width * asset.extract.width),
        height: Math.round(meta.height * asset.extract.height),
      });
    }

    const image = working.resize({
      width: asset.width,
      height: asset.height,
      fit: "cover",
      position: asset.position ?? "centre",
      kernel: "lanczos3",
    });

    const file = await image
      .webp({ quality: asset.quality ?? 84, effort: 6, smartSubsample: true })
      .toBuffer();
    await writeFile(path.join(OUT, `${asset.name}.webp`), file);

    const key = asset.name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    manifest[key] = {
      src: `/images/marketing/${asset.name}.webp`,
      width: asset.width,
      height: asset.height,
      blurDataURL: await blurDataUrl(buffer),
    };
    console.log(`✓ ${asset.name}.webp  ${(file.length / 1024).toFixed(0)} kB`);
  }

  const file = `// GENERATED FILE — run \`npm run assets\` after adding images to
// public/images/marketing/raw. Do not edit by hand.

export type MarketingImage = {
  src: string;
  width: number;
  height: number;
  blurDataURL: string;
};

export const marketingImages = ${JSON.stringify(manifest, null, 2)} as const satisfies Record<
  string,
  MarketingImage
>;

export type MarketingImageKey = keyof typeof marketingImages;

export function image(key: MarketingImageKey): MarketingImage {
  return marketingImages[key];
}
`;
  await writeFile(path.join(ROOT, "src/config/images.ts"), file);
  console.log(`\nWrote src/config/images.ts with ${Object.keys(manifest).length} images.`);
  if (missing.length) {
    console.log(`\nSkipped (raw file not generated yet): ${missing.join(", ")}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
