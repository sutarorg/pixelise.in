# Creative assets — Pixelise marketing imagery

All imagery on this site is **original and Pixelise-owned**: generated for this build, not stock,
not hotlinked, not taken from a competitor. No customer product is depicted and no image is
presented as a customer result.

- **Masters:** `public/images/marketing/raw/*.png` (2048px-class PNGs, ~23 MB total). Kept out of
  version control per `.gitignore`; regenerate from the prompts below.
- **Shipped derivatives:** `public/images/marketing/*.webp` (17 files, ~956 kB total).
- **Pipeline:** `scripts/build-assets.mjs` (`npm run assets`) → WebP q76–84, Lanczos3, plus a
  16-pixel LQIP per image written into `src/config/images.ts`.

---

## 1. Art direction

**The idea.** One product — a frosted 50 ml serum bottle with a blank ivory label and a brushed
silver dropper cap — photographed three ways: studio, lifestyle, advertising. The same bottle then
carries the use-case section and the gallery, so the site demonstrates the product's core claim
(one photo, three photographic decisions) rather than describing it.

**Product identity rules** (held across every frame):

- Cylindrical frosted clear glass, softly rounded shoulders, pale translucent gel.
- Warm ivory matte paper label, **completely blank**, with a single thin muted-violet rule near its
  lower edge. No text, no logo, no lettering anywhere in any image.
- Brushed matte-silver dropper cap with a rounded bulb.
- Consistent proportions and label height in every composition.

**Why the labels are blank.** A generated label produces gibberish typography and implies a
third-party brand. Blank labels keep the photography as the subject, keep the set legally clean, and
let the art direction read as studio craft rather than a fake product line.

**Lighting language**

| Style | Light | Surface | Palette |
| --- | --- | --- | --- |
| Studio | One large softbox upper-left, subtle fill, soft elongated contact shadow | Seamless warm off-white sweep | Ivory → light warm grey |
| Lifestyle | Diffused window light from the left, long soft shadows | Travertine, river stone, eucalyptus, oatmeal linen | Ivory, sand, sage |
| Advertising | Hard motivated key from the right + muted violet rim on the left | Dark polished stone, faint reflection, condensation | Charcoal, violet accent |

**Exclusions:** no neon, no floating props, no text overlays, no lens-flare gimmicks, no
over-saturated colour, no plastic-looking CGI render.

---

## 2. Generation prompts (verbatim)

### 2.1 Source photo — `raw/source-product.png`

> An ordinary, amateur-looking smartphone snapshot of a small skincare serum bottle. The product: a
> 50 ml cylindrical frosted clear glass serum bottle with softly rounded shoulders, filled with a
> pale translucent gel, a plain warm ivory matte paper label (completely blank, no text, no logo, only
> a single thin muted-violet horizontal rule near the bottom of the label), and a brushed matte-silver
> dropper cap. The bottle stands on a beige marble kitchen counter next to a folded grey dishcloth and
> the edge of a white ceramic mug, with a plain off-white wall and a hard electrical outlet blurred in
> the background. Mixed overhead kitchen lighting, slightly flat and uneven, mild shadow spill, faint
> fingerprints, a small dust speck and slight clutter on the counter. Shot straight on from a slightly
> awkward height at arm's length, eye-level, 4:5 portrait framing, product centred, small amount of
> empty counter space around it. Realistic phone camera colour, mild noise, nothing art-directed.
> Photorealism, no text anywhere in the image, no logos, no watermarks.

### 2.2 Studio — `raw/hero-studio.png`

> Premium commercial studio product photograph of exactly the same skincare serum bottle shown in the
> reference image: identical 50 ml cylindrical frosted clear glass bottle, same pale translucent gel,
> same blank warm ivory matte paper label with only a single thin muted-violet horizontal rule near its
> lower edge, same brushed matte-silver dropper cap. Do not add any text, logo or lettering to the
> label. The bottle stands alone on a seamless warm off-white studio backdrop with a gentle gradient
> from ivory to light warm grey. Large softbox key light from the upper left with a subtle fill from
> the right, producing a soft elongated contact shadow falling to the lower right and a faint glass
> reflection under the base. Crisp focus on the label and cap, natural glass refraction at the
> shoulders, delicate rim light along the right edge of the bottle. Photorealistic materials, accurate
> proportions, perfectly centred composition with generous negative space above, 4:5 vertical framing.
> High-end ecommerce hero photography, colour-accurate, no props, no text, no watermark.

### 2.3 Lifestyle — `raw/hero-lifestyle.png`

> Editorial lifestyle product photograph of exactly the same skincare serum bottle shown in the
> reference image: identical 50 ml cylindrical frosted clear glass bottle, same pale translucent gel,
> same blank warm ivory matte paper label with only a thin muted-violet horizontal rule near its lower
> edge, same brushed matte-silver dropper cap. No text, no logo, no lettering anywhere. The bottle
> stands on a pale travertine stone block beside a smooth river pebble, a small sprig of eucalyptus and
> a softly draped natural linen cloth in warm oatmeal tones. Warm natural window light from the left,
> gently diffused, casting long soft shadows across a sand-toned plaster wall behind. Shallow depth of
> field with the background falling into creamy softness, the product razor sharp. Controlled limited
> palette of ivory, sand, sage green and muted stone. Realistic glass, realistic stone texture,
> accurate product proportions, 4:5 vertical framing, product slightly left of centre with breathing
> room. Calm, sophisticated, art-directed lifestyle photography, no text, no watermark.

### 2.4 Advertising — `raw/hero-advertising.png`

> Dramatic high-end advertising product photograph of exactly the same skincare serum bottle shown in
> the reference image: identical 50 ml cylindrical frosted clear glass bottle, same pale translucent
> gel, same blank warm ivory matte paper label with only a thin muted-violet horizontal rule near its
> lower edge, same brushed matte-silver dropper cap. Absolutely no text, logo or lettering on the label
> or in the image. The bottle stands on a dark polished stone slab against a deep charcoal backdrop
> with a subtle violet glow gradient. Hard directional spotlight from the upper right creates a crisp
> sculptural shadow, while a soft muted-violet gel rim light traces the left contour of the glass. Tiny
> realistic condensation droplets on the glass shoulder, a faint mirror reflection beneath, drifting
> dust particles catching the light. Rich blacks, controlled violet accent, metallic cap with precise
> specular highlights, photorealistic glass and liquid. Bold centred composition, 4:5 vertical framing,
> cinematic editorial mood. Luxury cosmetic campaign photography, no text, no watermark.

### 2.5 Category imagery

| File | Prompt summary (full text used at generation time) |
| --- | --- |
| `usecase-fashion.png` | Minimalist tan full-grain leather crossbody bag, brushed brass clasp, strap coiled beside it, three-quarter angle on a warm grey seamless set, large softbox upper-left, visible grain and stitching, colour-accurate caramel, 4:5. |
| `usecase-jewellery.png` | Macro of an 18k gold signet ring with a square emerald on dark charcoal stone; strip-light highlight on the band, a second light on the stone, controlled speculars, soft reflection, deep charcoal gradient, no hotspot, 4:5. |
| `usecase-food.png` | Matte kraft stand-up coffee pouch with a completely blank cream label, on a warm sand surface with a linen napkin and scattered roasted beans, soft diffused side light, believable paper creases and seal detail, 4:5. |
| `usecase-home.png` | Amber glass candle with a blank ivory label, cream wax, on a pale oak block beside a ceramic dish and dried pampas, limewash plaster wall, late-afternoon window light, warm amber/cream/oak/stone-grey palette, 4:5. |
| `gallery-perfume-studio.png` | Heavy square-shouldered 100 ml perfume bottle, pale golden liquid, polished silver cap, blank ivory label, pale greige seamless backdrop, softbox upper-left plus right kicker, grounded shadow, 4:5. |
| `gallery-perfume-advertising.png` | The same perfume bottle on black glossy stone against a midnight backdrop, violet beam sweeping behind, hard key right, cool violet rim left, mirror reflection, a wisp of smoke, 4:5. |

---

## 3. Derivative map

`npm run assets` produces every file below from the masters. Nothing is generated at request time.

| Output | Source | Size | Used by |
| --- | --- | --- | --- |
| `hero-studio.webp` | `hero-studio.png` | 1200×1500 | Home hero main frame (LCP, `priority`), gallery |
| `hero-lifestyle.webp` | `hero-lifestyle.png` | 1200×1500 | Gallery, `/how-it-works` step 3 |
| `hero-advertising.webp` | `hero-advertising.png` | 1200×1500 | Gallery |
| `source-product.webp` | `source-product.png` | 860×1075 | Hero “your photo” card, `/how-it-works` step 1 |
| `style-studio.webp` | `hero-studio.png` | 1440×1080 (4:3 crop) | Photography styles card |
| `style-lifestyle.webp` | `hero-lifestyle.png` | 1440×1080 (4:3 crop) | Photography styles card |
| `style-advertising.webp` | `hero-advertising.png` | 1440×1080 (4:3 crop) | Photography styles card, `/how-it-works` step 2 |
| `preview-studio.webp` | `hero-studio.png` | 640×640 | Hero preview strip |
| `preview-lifestyle.webp` | `hero-lifestyle.png` | 640×640 | Hero preview strip |
| `preview-advertising.webp` | `hero-advertising.png` | 640×640 | Hero preview strip |
| `usecase-beauty.webp` | `hero-lifestyle.png` (tighter 85 % crop) | 1100×1375 | Use case — beauty & skincare |
| `usecase-fashion.webp` | `usecase-fashion.png` | 1100×1375 | Use case + gallery + `/features`, `/how-it-works` |
| `usecase-jewellery.webp` | `usecase-jewellery.png` | 1100×1375 | Use case + gallery + `/features` |
| `usecase-food.webp` | `usecase-food.png` | 1100×1375 | Use case + gallery + `/features` |
| `usecase-home.webp` | `usecase-home.png` | 1100×1375 (q76) | Use case + gallery |
| `gallery-perfume-studio.webp` | `gallery-perfume-studio.png` | 1100×1375 | Gallery |
| `gallery-perfume-advertising.webp` | `gallery-perfume-advertising.png` | 1100×1375 | Gallery |

**Deliberate reuse.** `usecase-beauty` is a tighter crop of the lifestyle frame rather than a new
render — the way a real shoot delivers several frames from one set-up. It keeps the beauty tile
distinct from the styles card on the same page while staying inside the same lighting.

**Alt text** is written per usage in `src/config/content.ts` and `src/config/gallery.ts`; it describes
the photograph (product, surface, light) rather than repeating a keyword.

---

## 4. Coverage against the brief

| Requested asset | Status |
| --- | --- |
| Minimal skincare bottle on a simple neutral surface | ✅ `source-product` (kitchen counter, un-styled) |
| Premium studio-lit version | ✅ `hero-studio` |
| Lifestyle composition — natural light, stones, plants, controlled props | ✅ `hero-lifestyle` |
| Dramatic advertising composition, editorial lighting | ✅ `hero-advertising` |
| Cosmetics | ✅ serum set + beauty crop |
| Perfume | ✅ `gallery-perfume-studio`, `gallery-perfume-advertising` |
| Jewellery | ✅ `usecase-jewellery` |
| Packaged goods | ✅ `usecase-food` |
| Additional categories | ✅ leather goods (`usecase-fashion`), home fragrance (`usecase-home`) |

**Deliberately not produced:** UGC-style “customer before/after” pairs, star ratings, and any image
implying a real brand or a real customer's product.

---

## 5. Reuse rules for later stages

1. Marketing imagery is Pixelise-owned and may be used in the app, emails and social — keep the
   blank-label convention so it never implies a third-party brand.
2. Do not add text to any of these images; typography belongs in the layout, not the photograph.
3. Any new marketing image must be generated from the documented art direction and added to
   `scripts/build-assets.mjs`, then re-run `npm run assets` so dimensions and blur placeholders stay
   accurate.
4. Keep masters out of version control; the WebP derivatives are the shipped artefacts.
