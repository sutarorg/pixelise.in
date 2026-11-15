import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/shared/section-heading";
import {
  IconDownload,
  IconGenerate,
  IconSwatch,
  IconUpload,
} from "@/components/shared/icons";
import { processSteps } from "@/config/content";
import { links, routes } from "@/config/site";

const icons = [IconUpload, IconSwatch, IconGenerate, IconDownload];

export function ProcessSteps() {
  return (
    <Section tone="canvas" space="lg" divider>
      <SectionHeading
        eyebrow="How it works"
        index="03"
        title="From a phone photo to a finished visual in four steps."
        lead="No briefs, no courier, no shoot day. The only thing you need to prepare is a photo of the product you already have in stock."
        action={
          <Button asChild variant="secondary">
            <Link href={routes.howItWorks}>How Pixelise works</Link>
          </Button>
        }
      />

      <div className="relative mt-14">
        <ol className="grid gap-10 sm:grid-cols-2 sm:gap-x-8 lg:grid-cols-4 lg:gap-6">
          {processSteps.map((step, index) => {
            const Icon = icons[index] ?? IconUpload;
            return (
              <li key={step.number} className="relative">
                {index < processSteps.length - 1 ? (
                  <span
                    aria-hidden="true"
                    className="absolute left-[3.25rem] right-[-1.5rem] top-[1.375rem] hidden border-t border-dashed border-line-strong lg:block"
                  />
                ) : null}
                <div className="flex items-center gap-3">
                  <span className="relative z-10 grid size-11 shrink-0 place-items-center rounded-full border border-line-strong bg-white font-mono text-[0.75rem] font-semibold tabular-nums text-violet-ink shadow-[0_0_0_6px_var(--color-canvas)]">
                    {step.number}
                  </span>
                  <Icon className="size-[1.35rem] text-violet/70" />
                </div>
                <h3 className="mt-5 text-[1.0625rem] font-bold leading-snug tracking-[-0.02em] text-ink">
                  {step.title}
                </h3>
                <p className="mt-2.5 text-[0.9375rem] leading-[1.62] text-muted-strong">
                  {step.summary}
                </p>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="mt-12 flex flex-col items-start gap-4 rounded-[var(--radius-card)] border border-line bg-surface px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-[38rem] text-[0.9375rem] leading-[1.6] text-muted-strong">
          Credits are only spent when you generate. Preparing a product and
          choosing a style costs nothing.
        </p>
        <Button asChild size="sm">
          <Link href={links.getStarted}>Start with one product</Link>
        </Button>
      </div>
    </Section>
  );
}
