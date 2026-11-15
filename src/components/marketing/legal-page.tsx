import * as React from "react";

import { Section } from "@/components/layout/section";
import { PageHero } from "@/components/marketing/page-hero";
import { Eyebrow } from "@/components/shared/eyebrow";
import { JsonLd } from "@/components/shared/json-ld";
import { breadcrumbSchema } from "@/lib/seo/structured-data";
import { routes } from "@/config/site";

export type PolicySection = {
  id: string;
  heading: string;
  content: React.ReactNode;
};

export function LegalPage({
  title,
  path,
  lead,
  updated,
  sections,
}: {
  title: string;
  /** Route path of this policy — used for the breadcrumb trail and JSON-LD. */
  path: string;
  lead: string;
  updated: string;
  sections: readonly PolicySection[];
}) {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title={title}
        lead={lead}
        crumbs={[{ label: "Home", href: routes.home }, { label: title }]}
        meta={
          <p className="text-[0.8125rem] text-muted">Last updated: {updated}</p>
        }
      />

      <Section tone="canvas" space="md">
        <div className="grid gap-12 lg:grid-cols-[15rem_1fr] lg:gap-16">
          <nav aria-label="On this page" className="lg:sticky lg:top-24 lg:self-start">
            <Eyebrow>On this page</Eyebrow>
            <ol className="mt-4 space-y-2">
              {sections.map((section, index) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="flex gap-2 rounded text-[0.8125rem] leading-[1.5] text-muted-strong transition-colors hover:text-ink"
                  >
                    <span className="font-mono text-[0.6875rem] tabular-nums text-muted/70">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {section.heading}
                  </a>
                </li>
              ))}
            </ol>

            <div className="mt-7 rounded-[12px] border border-line bg-surface p-4">
              <p className="text-[0.75rem] leading-[1.55] text-muted">
                This policy describes the public Pixelise website as it operates
                today: no accounts, no payments and no image generation happen on
                this domain. It will be extended before credit checkout opens.
              </p>
            </div>
          </nav>

          <article className="legal-copy max-w-[46rem]">
            {sections.map((section) => (
              <section key={section.id} id={section.id} aria-labelledby={`${section.id}-heading`}>
                <h2 id={`${section.id}-heading`}>{section.heading}</h2>
                {section.content}
              </section>
            ))}
          </article>
        </div>
      </Section>
      <JsonLd
        data={breadcrumbSchema([
          { label: "Home", href: routes.home },
          { label: title, href: path },
        ])}
      />
    </>
  );
}
