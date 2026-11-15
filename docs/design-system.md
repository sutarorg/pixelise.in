# Pixelise design system

Stage 1 foundation for the public website, and the base the customer and admin dashboards will
inherit in later stages.

Implementation: `src/styles/globals.css` (tokens + base + utilities) and `src/components/`.

---

## 1. Principles

1. **Photography is the interface.** The product is visual; the UI stays quiet so the imagery leads.
2. **One accent.** Violet is punctuation, never wallpaper. There is one violet panel on the site
   (the final CTA) and one violet word in the headline.
3. **Restraint over decoration.** Hairline borders, tinted surfaces and two soft shadows do the work
   that gradients and glassmorphism usually do.
4. **Editorial rhythm.** Sections alternate canvas → surface → tint, separated by 1 px rules, with
   numbered eyebrows as the page's cadence.
5. **Honest UI.** No control is rendered in a state that implies a capability that does not exist.

---

## 2. Colour tokens

Defined as Tailwind v4 theme variables, so they are available as utilities (`bg-violet`,
`text-muted-strong`, `border-line`) and as CSS variables.

| Token | Value | Use |
| --- | --- | --- |
| `--color-canvas` | `#FFFFFF` | Primary page background |
| `--color-surface` | `#FAF9FF` | Alternating section background, inset panels |
| `--color-tint` | `#F6F3FF` | Lavender sections, icon tiles, pricing band |
| `--color-tint-deep` | `#EFE9FF` | Hover state for tinted elements |
| `--color-violet` | `#6045F5` | Primary action, accent, logo tile |
| `--color-violet-hover` | `#4D35DA` | Primary hover |
| `--color-violet-ink` | `#4A31C9` | Violet text on light backgrounds (7.3:1) |
| `--color-violet-soft` | `#E8E2FF` | Reserved for chart/focus fills |
| `--color-ink` | `#15152C` | Headings, primary text |
| `--color-ink-soft` | `#2B2B45` | Nav labels, secondary headings |
| `--color-muted` | `#6F7083` | Body-on-white secondary text (4.87:1) |
| `--color-muted-strong` | `#5C5D70` | Body text on tinted surfaces (5.66:1) |
| `--color-line` | `#ECEAF4` | Default 1 px borders, dividers |
| `--color-line-strong` | `#DCD8EA` | Secondary button borders, stronger dividers |
| `--color-success` | `#16A36A` | Reserved; no success states on the public site yet |
| `--color-footer` | `#14132B` | Footer background |
| `--color-footer-line` | `#2A2947` | Footer dividers and pill borders |
| `--color-footer-text` | `#ADAEC4` | Footer body text (7.9:1 on footer) |

**Contrast rule:** `--color-muted` is only used on white or `surface` (≈4.7:1); on `tint` and
`tint-deep` the `muted-strong` token is used instead. This rule is applied throughout the codebase.

---

## 3. Typography

**Family:** Manrope (OFL), variable `wght 200–800`, self-hosted through `next/font/local`.
**Currency fallback:** a Manrope currency-only face on `unicode-range: U+20B9`, so `₹` matches.
**Mono:** system monospace (`font-mono`) for the section numerals and “on this page” indices only.

| Utility | Size | Line height | Tracking | Weight | Use |
| --- | --- | --- | --- | --- | --- |
| `text-display` | `clamp(2.45rem, 1.15rem + 4.6vw, 4.05rem)` | 1.03 | −0.038em | 800 | Homepage `<h1>` |
| `text-display-sm` | `clamp(2.1rem, 1.3rem + 2.6vw, 3.15rem)` | 1.06 | −0.034em | 800 | Inner page `<h1>`, final CTA `<h2>` |
| `text-h2` | `clamp(1.8rem, 1.2rem + 2.1vw, 2.65rem)` | 1.1 | −0.032em | 700 | Section headings |
| `text-h3` | `clamp(1.125rem, 1.05rem + 0.32vw, 1.3125rem)` | 1.3 | −0.02em | 700 | Card headings |
| `text-lead` | `clamp(1.0625rem, 1rem + 0.28vw, 1.1875rem)` | 1.66 | — | 400 | Hero and section supporting copy |
| `text-body` | `1rem` | 1.68 | — | 400 | Long-form legal and article copy |
| `text-eyebrow` | `0.6875rem` | 1 | 0.18em | 700 | Uppercase section labels |
| `text-micro` | `0.75rem` | 1.5 | 0.02em | 400 | Captions, footnotes |

Rules: headings use `text-wrap: balance`; paragraphs use `text-wrap: pretty`; prices use
`tabular-nums`; no text is smaller than 10 px anywhere on the site (image captions in the hero
composition are the single 10 px exception, paired with strong weight and tracking).

---

## 4. Spacing, layout and radii

- **Page container:** `max-width: 1320px` (`--container-page`), gutter `20px` mobile → `32px` from
  `sm`. Implemented once in `<Container>`.
- **Section padding:** `sm 48–56`, `md 64–96`, `lg 80–128` px via `<Section space>`.
- **Grid gutters:** 16 px for tight card grids, 20–24 px for editorial grids, 40–64 px for
  two-column content rows.
- **Radii:** buttons `8–11px`, cards `18px` (`--radius-card`), panels `24–28px`, pills `full`.
- **Borders:** always 1 px; `line` by default, `line-strong` for interactive outlines,
  `violet/30` for the highlighted pricing card.
- **Elevation:** three tokens only.

| Token | Composition | Use |
| --- | --- | --- |
| `--shadow-card` | `0 1px 2px rgb(21 21 44 / .04), 0 14px 28px -22px rgb(21 21 44 / .18)` | Default cards |
| `--shadow-lift` | `0 2px 4px rgb(21 21 44 / .04), 0 26px 48px -32px rgb(21 21 44 / .24)` | Hover, media cards |
| `--shadow-float` | `0 18px 44px -26px rgb(41 26 110 / .3), 0 3px 10px rgb(21 21 44 / .06)` | Floating source photo, menus, drawer |

Hover motion is `-translate-y-0.5` plus a shadow change — never scale on cards, scale only on
images inside their own overflow-hidden frame (`group-hover:scale-[1.03]`).

---

## 5. Breakpoints and responsive intent

Tailwind defaults: `sm 640`, `md 768`, `lg 1024`, `xl 1280`. Targets: 1440, 1280, 1024, 768, 390, 360.

| Area | Desktop ≥1024 | Tablet 768–1023 | Mobile <768 |
| --- | --- | --- | --- |
| Header | 3-column grid; centred nav; log in + CTA | Nav collapses to drawer at `<lg` | Logo + drawer trigger only; CTAs inside drawer |
| Hero | 43/57 two columns, composition right | Stacked, composition full width | Stacked, larger relative type, previews stay 3-up |
| Feature cards | 4 across at `xl`, 2 at `sm` | 2 across | 1 across |
| Photography styles | 3 across | 1 across (stacked cards) | 1 across |
| Process | 4 across with dashed connectors | 2 across, connectors hidden | 2 across, connectors hidden |
| Use cases | 6/6 then 4/4/4 + CTA tile | 2 across | 1 across |
| Pricing | 2 across | 2 across | 1 across |
| Footer | Brand + 4 link columns | 2 columns | 2 columns |
| Gallery filters | inline with count | inline | wraps, full-width row |

`overflow-hidden` is applied to decorative backgrounds only; content columns never clip. Wide table
(`/pricing` comparison) scrolls inside `overflow-x-auto` with a `min-w` and a screen-reader caption.

---

## 6. Component inventory

### Layout (`src/components/layout/`)
- `Container` — max width + gutters.
- `Section` — tone (`canvas`/`surface`/`tint`/`ink`), spacing, optional divider, optional container.
- `Logo` / `LogoMark` — pixel-tile mark + wordmark; `tone="inverse"` for the footer.
- `SiteHeader` — sticky, 64 px, scroll-aware border/shadow, centred nav, log in + CTA, drawer
  trigger below `lg`. Client component (scroll state + active route).
- `ResourcesMenu` — Radix dropdown, hover-open with pointer-leave intent delay, keyboard via Radix.
- `MobileNav` — Radix Dialog drawer with focus trap, Escape, scroll lock, 44 px targets.
- `SiteFooter` — dark ink panel, brand + 4 link columns + legal bar.
- `SkipLink` — bypass block.

### UI primitives (`src/components/ui/`)
`Button` (variants: primary, secondary, tint, inverse, inverseOutline, ghost, link; sizes sm/md/lg/xl;
`asChild` for links), `Card` (default, flat, tint, ghost, inverse, highlighted), `Badge` (outline,
tint, violet, inverse, success), `Accordion`, `Sheet` (Dialog), `Input`, `Textarea`, `Select`,
`Label`, `FieldHint`.

### Shared (`src/components/shared/`)
`Eyebrow` (optional numeric index), `SectionHeading`, `Breadcrumbs`, `JsonLd`, `MarketingImage`
(manifest-bound `next/image` with blur + sizes), custom icon set (`IconLens`, `IconLayers`,
`IconSpark`, `IconCredits`, `IconUpload`, `IconSwatch`, `IconGenerate`, `IconDownload`, `IconCheck`,
`IconArrowRight`, `DrawnArrow`).

### Marketing (`src/components/marketing/`)
`Hero`, `HeroComposition`, `AudienceStrip`, `FeatureGrid`, `FeatureRow`, `StylesShowcase`,
`ProcessSteps`, `UseCaseGrid`, `PricingCards`, `PricingSection`, `FaqSection`, `FaqList`, `FinalCta`,
`PageHero`, `ExamplesGallery`, `ContactForm`, `LegalPage`.

---

## 7. Interaction and states

| State | Treatment |
| --- | --- |
| Hover (link) | Colour shift to ink/violet-ink; no underline jump |
| Hover (card) | `-translate-y-0.5`, border `line-strong`, `shadow-lift` |
| Hover (image in card) | `scale-[1.03]` inside a clipped frame, 600 ms ease-out |
| Focus | 2 px violet outline, 3 px offset, 4 px radius; components add their own where clipping would hide it |
| Active / current | `aria-current="page"` + a 2 px violet underline on nav items |
| Disabled | 55 % opacity, `pointer-events-none`, `cursor-not-allowed` |
| Selected (filter) | Violet fill, white label, `aria-pressed="true"` |
| Reduced motion | All durations forced to 0.001 ms; smooth scroll disabled |

Motion inventory: one entrance animation (`animate-rise`, 700 ms, transform + opacity) on the hero,
accordion open/close, drawer slide, menu fade, and hover transitions ≤ 600 ms. Nothing loops.

---

## 8. Content rules

- Bilingual-free, India-first English; prices always in `₹` with `tabular-nums`.
- Never state a generation speed, savings figure, customer count, rating or licensing promise that
  is not confirmed business information.
- Legal and policy copy describes only what the site actually does today; unknowns are recorded in
  `docs/owner-inputs.md` instead of being invented on the page.
- Any control that would require the stage-4 backend is rendered honestly disabled with an
  explanation, never as a simulated success.

---

## 9. Extending into the dashboards (stage 2+)

- Reuse `src/components/ui/*` unchanged; the dashboards should not introduce a second button system.
- Keep tokens in `globals.css`; add dashboard-specific tokens under a `.dashboard` scope rather than
  editing the marketing palette.
- Route groups: keep `(marketing)` as-is; add `(app)` for customer routes and `(admin)` for admin
  routes so layouts, metadata and `robots` stay separate.
- Use the same `MarketingImage` pattern for user images, but without blur placeholders for
  user-uploaded content.
- The SEO helpers in `src/lib/seo/` should not be imported by authenticated routes; those render
  `robots: { index: false }`.

---

## Stage 2 — application layer

The dashboard adds no tokens. It adds *applications* of the same system, tuned for density.

| Token / pattern | Marketing use | Application use |
| --- | --- | --- |
| `--color-canvas` / `--color-surface` | page background, alternate bands | `surface` is the workspace canvas; panels are `canvas` (white) |
| `--color-violet` | CTAs, accents | primary action, active nav, brand marks only — filters use `violet/10` tints |
| `--color-line` | section rules | every panel edge, table rule, sidebar divider |
| `--radius-card` (18px) | feature cards | workspace panels; inner items use 10–14px |
| `--shadow-card` | feature cards | every panel; `lift` for the canvas status pill, `float` for dialogs |
| Type scale | display 39–65px | page title 22–24px, card title 15px, UI 13–14px, labels 11px uppercase |
| Buttons | `sm`/`md`/`lg`/`xl` | `sm` in toolbars, `md` in forms, `lg` for Generate and Checkout |

**Application-specific patterns** (all built from the primitives, none replacing them):

- **Nav item** — 40px row, 10px radius, icon 17px + 13.5px semibold label; active = `bg-tint`,
  `text-violet-ink`, inset violet ring, `aria-current="page"`.
- **Credit chip** — 36px pill on `surface` with a violet coin glyph, tabular number, "credits".
- **Selectable card** (style, scene, aspect ratio, quality) — real radio input inside a `<label>`;
  selected = violet border + `bg-tint` + violet check. Never colour-only.
- **Status pill** — 11px uppercase bold, tonal background: progress = tint, success = mint,
  failure = rose, idle = surface.
- **Empty / error region** — centred 48px icon tile, one bold line, one sentence, one action;
  error states add a collapsed "Technical details" disclosure with code, status and request id.
- **Table** — 12px header caps, 13px rows, 0.5px dividers, right-aligned numerics; below `md` the same
  records become stacked cards instead of a scrolled table.
- **Dialog** — 16px radius, 27rem max width, focus trapped by Radix, destructive confirm is rose, and
  irreversible actions require typing a word.
