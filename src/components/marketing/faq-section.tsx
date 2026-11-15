import Link from "next/link";

import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/shared/section-heading";
import { FaqList } from "@/components/marketing/faq-list";
import { IconArrowRight } from "@/components/shared/icons";
import { faqs, homeFaqIds } from "@/config/content";
import { routes } from "@/config/site";

export function FaqSection() {
  const items = faqs.filter((faq) =>
    (homeFaqIds as readonly string[]).includes(faq.id),
  );

  return (
    <Section tone="surface" space="lg" divider>
      <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <SectionHeading
            eyebrow="FAQ"
            index="06"
            title="Questions, answered plainly."
            lead="Credits, packs, styles and what you can do with the images. Nothing here is a promise the product does not make."
          />
          <div className="mt-8 rounded-[var(--radius-card)] border border-line bg-white p-5">
            <p className="text-[0.875rem] font-semibold text-ink">
              Still unsure about something?
            </p>
            <p className="mt-1.5 text-[0.8125rem] leading-[1.55] text-muted">
              Questions about a pack, a credit balance or an image all go to the
              same place.
            </p>
            <Link
              href={routes.faq}
              className="mt-4 inline-flex items-center gap-1.5 rounded text-[0.875rem] font-semibold text-violet-ink transition-[gap] duration-200 hover:gap-2.5"
            >
              Read every question
              <IconArrowRight className="size-[0.9rem]" />
            </Link>
          </div>
        </div>

        <FaqList items={items} className="border-t border-line" defaultOpen={items[0]?.id} />
      </div>
    </Section>
  );
}
