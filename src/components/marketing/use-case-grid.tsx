import Link from "next/link";

import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/shared/section-heading";
import { MarketingImage } from "@/components/shared/marketing-image";
import { IconArrowRight } from "@/components/shared/icons";
import { useCases } from "@/config/content";
import { links } from "@/config/site";
import { cn } from "@/lib/utils";

export function UseCaseGrid() {
  return (
    <Section tone="surface" space="lg" divider>
      <SectionHeading
        layout="split"
        eyebrow="Use cases"
        index="04"
        title="Built for the products you actually sell."
        lead="Different categories need different light. The studio is tuned for the materials and finishes that are hardest to photograph honestly — glass, metal, leather and printed packaging."
      />

      <ul className="mt-12 grid gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-12 lg:gap-y-10">
        {useCases.map((useCase, index) => (
          <li
            key={useCase.id}
            className={cn(
              "h-full",
              index < 2 ? "lg:col-span-6" : "lg:col-span-4",
            )}
          >
            <article className="group flex h-full flex-col">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
                <MarketingImage
                  imageKey={useCase.image}
                  alt={useCase.alt}
                  sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
                  fill
                  imageClassName="object-cover transition-transform duration-[600ms] ease-out group-hover:scale-[1.03]"
                />
              </div>
              <div className="mt-5 flex flex-col">
                <p className="text-eyebrow text-violet-ink">{useCase.category}</p>
                <h3 className="mt-2.5 text-[1.0625rem] font-bold leading-snug tracking-[-0.02em] text-ink">
                  {useCase.title}
                </h3>
                <p className="mt-2 max-w-[34rem] text-[0.9375rem] leading-[1.62] text-muted-strong">
                  {useCase.summary}
                </p>
              </div>
            </article>
          </li>
        ))}

        <li className="h-full lg:col-span-4">
          <div className="flex h-full flex-col justify-between gap-6 rounded-[var(--radius-card)] border border-violet/15 bg-tint p-6">
            <p className="text-[1.0625rem] font-bold leading-snug tracking-[-0.02em] text-ink">
              Your category not listed? If it can be photographed on a surface,
              Pixelise can put it in a set.
            </p>
            <Link
              href={links.getStarted}
              className="inline-flex items-center gap-1.5 rounded text-[0.875rem] font-semibold text-violet-ink transition-[gap] duration-200 hover:gap-2.5"
            >
              Start with your product
              <IconArrowRight className="size-[0.9rem]" />
            </Link>
          </div>
        </li>
      </ul>
    </Section>
  );
}
