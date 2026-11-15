import { MarketingImage } from "@/components/shared/marketing-image";
import { DrawnArrow } from "@/components/shared/icons";

const previews = [
  {
    label: "Studio",
    imageKey: "previewStudio",
    alt: "Studio preview: skincare bottle on a clean neutral backdrop",
  },
  {
    label: "Lifestyle",
    imageKey: "previewLifestyle",
    alt: "Lifestyle preview: skincare bottle on travertine with eucalyptus and linen",
  },
  {
    label: "Advertising",
    imageKey: "previewAdvertising",
    alt: "Advertising preview: skincare bottle on dark stone with violet rim light",
  },
] as const;

/**
 * The signature hero composition: an owner's phone photo, a drawn directional
 * mark, the rendered studio result and the three style previews. Built with
 * plain containers so the overlap stays predictable from 360px to 1440px.
 */
export function HeroComposition() {
  return (
    <div className="relative mx-auto w-full max-w-[40rem] lg:mx-0 lg:ml-auto">
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-[26px] border border-line bg-[radial-gradient(120%_100%_at_90%_0%,#F1ECFF_0%,#FBFAFF_45%,#FFFFFF_100%)] shadow-[inset_0_1px_0_rgb(255_255_255_/_0.9)]"
      />

      <div className="relative p-2.5 sm:p-3.5">
        <div className="relative">
          {/* Rendered result */}
          <figure className="relative ml-auto w-full overflow-hidden rounded-[18px] bg-white shadow-lift ring-1 ring-ink/[0.06] lg:w-[70%]">
            <div className="relative aspect-[4/5]">
              <MarketingImage
                imageKey="heroStudio"
                alt="A frosted skincare serum bottle photographed on a warm off-white studio backdrop with a soft contact shadow"
                sizes="(max-width: 1023px) 92vw, 40vw"
                priority
                fill
              />
            </div>
            <figcaption className="absolute left-2.5 top-2.5 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[0.625rem] font-bold uppercase tracking-[0.14em] text-ink/75 ring-1 ring-ink/[0.06] backdrop-blur-sm">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-violet" />
              Studio
            </figcaption>
          </figure>

          {/* Source photo */}
          <figure className="absolute left-0 top-[8%] w-[31%] -rotate-[3.5deg] rounded-[14px] bg-white p-1.5 shadow-float ring-1 ring-line lg:top-[7%] lg:w-[26%]">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[10px]">
              <MarketingImage
                imageKey="sourceProduct"
                alt="The original phone snapshot of the same serum bottle on a kitchen counter"
                sizes="(max-width: 1023px) 30vw, 13vw"
                fill
                imageClassName="object-cover saturate-[0.94]"
              />
            </div>
            <figcaption className="mt-1.5 text-center text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-muted">
              Your photo
            </figcaption>
          </figure>

          {/* Drawn directional mark */}
          <DrawnArrow className="absolute left-[27%] top-[26%] w-[17%] -rotate-[6deg] text-violet/70 lg:left-[24%] lg:top-[27%] lg:w-[16%]" />

          {/* Style previews */}
          <div className="mt-3 grid grid-cols-3 gap-2 lg:mt-3.5">
            {previews.map((preview) => (
              <div
                key={preview.label}
                className="rounded-[12px] bg-white p-1 shadow-card ring-1 ring-line"
              >
                <div className="relative aspect-square overflow-hidden rounded-[8px]">
                  <MarketingImage
                    imageKey={preview.imageKey}
                    alt={preview.alt}
                    sizes="(max-width: 1023px) 28vw, 11vw"
                    fill
                  />
                </div>
                <p className="py-1 text-center text-[0.625rem] font-semibold uppercase tracking-[0.1em] text-muted-strong">
                  {preview.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
