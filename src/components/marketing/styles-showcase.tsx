import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/shared/section-heading";
import { MarketingImage } from "@/components/shared/marketing-image";
import { IconArrowRight } from "@/components/shared/icons";
import { photographyStyles } from "@/config/content";
import { links, routes } from "@/config/site";

export function StylesShowcase() {
  return (
    <Section tone="surface" space="lg" divider>
      <SectionHeading
        eyebrow="Photography styles"
        index="02"
        title="One product photo. Three ways to shoot it."
        lead="Studio, Lifestyle and Advertising are three different lighting and set decisions — not three filters on the same render. Each one is built for a different place your product has to appear."
        action={
          <Button asChild variant="secondary">
            <Link href={routes.examples}>Browse examples</Link>
          </Button>
        }
      />

      <ul className="mt-12 grid gap-5 lg:grid-cols-3">
        {photographyStyles.map((style) => (
          <li key={style.id} className="h-full">
            <article className="group flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-white shadow-card transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-lift">
              <div className="relative aspect-[4/3] overflow-hidden bg-surface">
                <MarketingImage
                  imageKey={style.image}
                  alt={style.alt}
                  sizes="(max-width: 1023px) 100vw, 32vw"
                  fill
                  imageClassName="object-cover transition-transform duration-[600ms] ease-out group-hover:scale-[1.03]"
                />
                <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[0.5625rem] font-bold uppercase tracking-[0.14em] text-ink/80 ring-1 ring-ink/[0.06] backdrop-blur-sm">
                  <span aria-hidden="true" className="size-1.5 rounded-full bg-violet" />
                  {style.name}
                </span>
              </div>

              <div className="flex flex-1 flex-col p-6">
                <h3 className="text-h3 text-ink">{style.headline}</h3>
                <p className="mt-2.5 text-[0.9375rem] leading-[1.62] text-muted-strong">
                  {style.summary}
                </p>
                <div className="mt-auto pt-6">
                  <Link
                    href={links.getStarted}
                    className="inline-flex items-center gap-1.5 rounded text-[0.875rem] font-semibold text-violet-ink transition-[gap,color] duration-200 hover:gap-2.5 hover:text-violet"
                  >
                    {style.ctaLabel}
                    <IconArrowRight className="size-[0.9rem]" />
                  </Link>
                </div>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </Section>
  );
}
