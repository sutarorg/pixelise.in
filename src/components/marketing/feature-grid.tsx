import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/shared/section-heading";
import { IconCredits, IconLayers, IconLens, IconSpark } from "@/components/shared/icons";
import { features } from "@/config/content";
import { routes } from "@/config/site";

const icons = {
  quality: IconLens,
  styles: IconLayers,
  speed: IconSpark,
  cost: IconCredits,
} as const;

export function FeatureGrid({
  eyebrow = "What you get",
  index = "01",
  title = "Everything you need to create stunning product photos.",
  lead = "Four capabilities do the heavy lifting: a believable render, three distinct photography styles, a workflow that skips the shoot, and pricing that does not renew itself every month.",
  showAction = true,
  tone = "canvas",
  className,
}: {
  eyebrow?: string;
  index?: string;
  title?: string;
  lead?: string;
  showAction?: boolean;
  tone?: "canvas" | "surface";
  className?: string;
}) {
  return (
    <Section tone={tone} space="lg" className={className}>
      <SectionHeading
        eyebrow={eyebrow}
        index={index}
        title={title}
        lead={lead}
        action={
          showAction ? (
            <Button asChild variant="secondary" size="md">
              <Link href={routes.features}>See all features</Link>
            </Button>
          ) : undefined
        }
      />

      <ul className="mt-12 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {features.map((feature, index) => {
          const Icon = icons[feature.id as keyof typeof icons];
          return (
            <li key={feature.id} className="h-full">
              <article className="group relative flex h-full flex-col rounded-[var(--radius-card)] border border-line bg-white p-6 shadow-card transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-lift">
                <div className="flex items-start justify-between">
                  <span className="grid size-11 place-items-center rounded-[12px] border border-violet/12 bg-tint text-violet">
                    <Icon className="size-[22px]" />
                  </span>
                  <span
                    aria-hidden="true"
                    className="font-mono text-[0.6875rem] tabular-nums tracking-[0.1em] text-muted/60"
                  >
                    0{index + 1}
                  </span>
                </div>
                <h3 className="text-h3 mt-6 text-ink">{feature.title}</h3>
                <p className="mt-2.5 text-[0.9375rem] leading-[1.62] text-muted-strong">
                  {feature.summary}
                </p>
              </article>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
