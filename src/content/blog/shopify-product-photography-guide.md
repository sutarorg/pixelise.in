A Shopify product page has one job before the copy is read: convince a shopper that the thing in the photograph is the thing they will receive. Every layout decision in a theme — the collection grid, the quick-view modal, the zoom, the sticky add-to-cart — assumes the image can carry that weight.

This guide covers what Shopify itself specifies, how themes use those files, and a repeatable workflow for producing images that survive both.

## What Shopify actually requires

Shopify's own documentation is short and specific. From the Shopify Help Center page on product media:

- Product and collection images can be **any size up to 5000 × 5000 px, or 25 megapixels**.
- Files must be **smaller than 20 MB**.
- For square product images, **2048 × 2048 px usually displays best**.
- The Help Center names **PNG as the best file type for most product images, followed by JPEG**; TIFF, BMP, GIF, SVG and WebP are also accepted.
- Shopify's image service detects what a customer's browser supports and serves an appropriate format automatically, and generates several sizes of each upload for use across the theme.

Those are the hard limits. Everything else — aspect ratio consistency, background choice, number of images — is a merchandising decision, not a platform rule.

| Specification | Value | Source |
| --- | --- | --- |
| Maximum dimensions | 5000 × 5000 px or 25 MP | Shopify Help Center |
| Maximum file size | 20 MB | Shopify Help Center |
| Recommended square size | 2048 × 2048 px | Shopify Help Center |
| Preferred formats | PNG, then JPEG | Shopify Help Center |
| Formats accepted | TIFF, BMP, GIF, SVG, HEIC, WebP, animated GIF/WebP | Shopify Help Center |
| Resizing | Automatic, multiple derived sizes | Shopify Help Center |

One practical note on format: PNG is lossless, which is why Shopify recommends it, but photographic PNGs are heavy. If your theme serves a compressed derivative anyway, a high-quality JPEG at 2048 px is usually indistinguishable on screen and much faster to upload. Test with your own theme before standardising.

## Why square matters more than it should

Most Shopify themes render product cards in a fixed aspect ratio, and many use a square or 4:5 crop with `object-fit: cover`. If your catalogue mixes square, portrait and landscape originals, the grid either letterboxes products or crops them inconsistently — a tall bottle loses its cap in one card and gains white space in another.

Two ways to fix it:

1. **Upload consistent square images** (2048 × 2048) and let the theme do the rest.
2. **Upload the natural ratio**, but compose every image so the product sits inside a square safe area with margin on all sides.

The second approach preserves detail for zoom but requires discipline: the product must be centred, with at least 8–10% padding on the shortest side, or the grid crop will clip it.

## Building a repeatable shoot

Consistency across a catalogue comes from removing decisions, not from adding creativity. A simple studio setup covers most categories:

- **One light, large and close.** A 90 cm softbox or a window with diffusion, placed at roughly 45 degrees, gives soft shadows and readable texture. A second light is optional; a second *highlight* is usually a mistake.
- **A white or light neutral sweep** for the primary images, curving from floor to wall so there is no horizon line.
- **A tripod and a fixed height.** Same camera position for every SKU means consistent perspective, which makes the grid look designed.
- **A grey card or colour reference** in the first frame of each session, cropped out later. It costs ten seconds and solves colour arguments.
- **A tethered or Wi-Fi preview** so you can check focus on a laptop rather than a 3-inch screen.

Shoot the packshot first — the plain, honest front view. Then add: a 45-degree angle, a detail of the most important feature, a scale reference, and one lifestyle frame. That is a five-image set that answers most pre-purchase questions.

## Processing the files

The processing chain matters as much as the capture. A workable routine:

1. **Crop to square** with consistent product scale across the catalogue. A bottle should occupy roughly the same proportion of the frame as a box, unless the size difference is the point.
2. **Clean the background to pure white or your brand neutral.** Check the edges at 200% — a grey halo is the most common giveaway of a rushed cutout.
3. **Correct colour against the reference frame**, not by eye.
4. **Sharpen for screen**, lightly. Shopify resizes images; over-sharpened files produce halos after resampling.
5. **Export at 2048 px** for the long edge, with a file size comfortably under Shopify's 20 MB limit. Aim for a few hundred KB for photographic JPEGs.
6. **Name the file descriptively** — `pixelise-ceramic-mug-sand-01.jpg`, not `IMG_4821.jpg`. The filename becomes part of the image URL.
7. **Write alt text** that describes the product and the view, for accessibility and image search.

## Alt text, order and variants

Three small things separate a functional product gallery from a frustrating one.

**Alt text.** Describe what is visible: "Stoneware mug in sand glaze, side view, on a white background." Not "mug" and not a keyword list. Screen-reader users and search engines both benefit, and Google's image guidance is explicit that descriptive alt text helps images be understood.

**Image order.** The first image answers "what is it". The second answers "what does it look like from another angle". The third answers the objection the product most often raises — size, texture, what is included. Do not lead with a lifestyle shot unless the product is unrecognisable without context.

**Variant images.** If colour or size changes the product's appearance, assign an image to each variant. A shopper who selects "sage" and sees the sand-coloured mug has been misled by omission, even if the photo is accurate for another variant.

## Common Shopify image mistakes

- **Uploading 600 px images and letting the theme upscale.** Zoom becomes a blurry disappointment, and `object-fit` cannot invent detail.
- **Mixing backgrounds across a collection.** The grid reads as a marketplace stall rather than a brand.
- **Using a lifestyle image as the main image** for a product with a distinctive shape that needs a clean silhouette.
- **Ignoring mobile.** Most traffic is mobile, where the grid is two columns and the image is small. Test the crop at 360 px wide before publishing.
- **Forgetting the collection image.** Collection cards use their own image field; if it is empty, Shopify falls back to the first product image, which may crop badly.
- **Compressing to 40 KB.** Fast, but the zoom looks like a compressed video still.

## Where AI fits — and where it does not

Background replacement is the safest AI use in a Shopify catalogue: the product pixels stay the same, the sweep becomes consistent, and the grid looks deliberate. Generated lifestyle scenes work for secondary images when the scene is plausible and the product's label is untouched.

Generated images fail on Shopify in the same places they fail everywhere: invented label text, altered logos, and products that no longer match the variant. Since Shopify lets customers zoom, the failure is visible to anyone who looks closely — which is exactly the shopper who was about to buy.

If you use generated imagery, keep the original photograph on file, review at 100%, and label the secondary scene honestly in the alt text (for example, "shown in a styled kitchen setting").

## A launch checklist

- [ ] Every product has at least three images: front, angle, detail.
- [ ] Images are square, 2048 px, under 20 MB, with consistent product scale.
- [ ] Background is consistent across each collection.
- [ ] File names are descriptive and hyphenated.
- [ ] Alt text describes product and view.
- [ ] Variant images are assigned for every colour and size.
- [ ] Collection images are set explicitly.
- [ ] Mobile crop checked at 360 px width.
- [ ] Zoom checked at 200% for edge artefacts and label legibility.
- [ ] Colour checked against a physical sample or reference frame.

Work through that list once per collection and the store stops looking like a side project.

## Frequently asked questions

### What is the best Shopify product image size?

Shopify recommends 2048 × 2048 px for square product images, with a maximum of 5000 × 5000 px or 25 megapixels and a 20 MB file limit. Those figures come from Shopify's Help Center, not from theme vendors.

### Should I use PNG or JPEG?

Shopify names PNG as the best file type for most product images, followed by JPEG. PNG preserves detail and supports transparency but produces large photographic files; JPEG is smaller and usually indistinguishable at 2048 px on screen. Keep PNG where you need transparency or crisp graphics.

### How many images should a product page have?

Enough to answer the obvious questions: what it is, how it looks from other angles, how big it is, and what it looks like in use. Five is a practical target for most products; complex items need more.

### Can I use AI-generated images on Shopify?

Shopify does not prohibit edited or composite images. The requirement is practical and commercial: the image must accurately represent the product. Generated scenes are usually fine for secondary lifestyle images; generated products are not.

## Sources

- Shopify Help Center — Product media types (dimensions, formats, file size, resizing): <https://help.shopify.com/en/manual/products/product-media/product-media-types>
- Shopify Help Center — File requirements for uploads: <https://help.shopify.com/en/manual/shopify-admin/productivity-tools/file-uploads>
- Google Search Central — Image SEO best practices: <https://developers.google.com/search/docs/appearance/google-images>
- Google Search Central — Product structured data (for rich product results): <https://developers.google.com/search/docs/appearance/structured-data/product>

For the storefront-independent version of this advice, see our [product photography background guide](/blog/product-photography-background-guide) and the [AI product photography overview](/blog/ai-product-photography-ecommerce-guide).
