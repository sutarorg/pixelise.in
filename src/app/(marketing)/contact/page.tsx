import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Section } from "@/components/layout/section";
import { PageHero } from "@/components/marketing/page-hero";
import { ContactForm } from "@/components/marketing/contact-form";
import { Eyebrow } from "@/components/shared/eyebrow";
import { JsonLd } from "@/components/shared/json-ld";
import { IconArrowRight } from "@/components/shared/icons";
import { pageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema } from "@/lib/seo/structured-data";
import { routes } from "@/config/site";

export const metadata: Metadata = pageMetadata({
  title: "Contact Support",
  description:
    "How to reach Pixelise support about a credit pack, a balance, an image or using the studio in your store, plus the questions the FAQ already answers.",
  path: routes.contact,
});

const whatToInclude = [
  "The pack you bought, if your question is about credits or billing.",
  "The product category and photography style, if it is about an image.",
  "Your browser and device, if something in the studio is not working.",
  "The exact wording of any error you saw, if there was one.",
] as const;

const quickLinks = [
  { label: "Read the FAQ", href: routes.faq, description: "Credits, packs, styles and usage." },
  {
    label: "Compare the packs",
    href: routes.pricing,
    description: "Creator ₹499 and Studio ₹999, side by side.",
  },
  {
    label: "Refund policy",
    href: routes.refund,
    description: "What applies to a credit purchase.",
  },
] as const;

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Talk to a human about credits, images or your account."
        lead="Support questions, billing questions and anything about how a visual came out all go to the same place. This page explains what to include and what is already answered elsewhere."
        crumbs={[
          { label: "Home", href: routes.home },
          { label: "Contact" },
        ]}
      />

      <Section tone="canvas" space="lg">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
          <div>
            <Eyebrow>Support form</Eyebrow>
            <div className="mt-5">
              <ContactForm />
            </div>
          </div>

          <aside className="flex flex-col gap-6">
            <div className="rounded-[var(--radius-card)] border border-line bg-surface p-6">
              <h2 className="text-[1.0625rem] font-bold tracking-[-0.02em] text-ink">
                What to include in a message
              </h2>
              <ul className="mt-4 space-y-2.5">
                {whatToInclude.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <IconArrowRight className="mt-1 size-3.5 shrink-0 text-violet" />
                    <span className="text-[0.875rem] leading-[1.55] text-muted-strong">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-[var(--radius-card)] border border-line bg-white p-6">
              <h2 className="text-[1.0625rem] font-bold tracking-[-0.02em] text-ink">
                Answered already
              </h2>
              <ul className="mt-4 divide-y divide-line">
                {quickLinks.map((link) => (
                  <li key={link.href} className="py-3 first:pt-0 last:pb-0">
                    <Link
                      href={link.href}
                      className="group flex items-start justify-between gap-4 rounded"
                    >
                      <span>
                        <span className="block text-[0.875rem] font-semibold text-ink group-hover:text-violet-ink">
                          {link.label}
                        </span>
                        <span className="mt-0.5 block text-[0.8125rem] leading-[1.5] text-muted">
                          {link.description}
                        </span>
                      </span>
                      <IconArrowRight className="mt-1 size-4 shrink-0 text-line-strong transition-colors group-hover:text-violet" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-[var(--radius-card)] border border-violet/15 bg-tint p-6">
              <h2 className="text-[1.0625rem] font-bold tracking-[-0.02em] text-ink">
                Before you write
              </h2>
              <p className="mt-2 text-[0.875rem] leading-[1.6] text-muted-strong">
                If your question is about a specific image, have the product
                category, the style and the generation date ready. It is the
                fastest way to get a useful answer.
              </p>
              <Button asChild variant="secondary" size="sm" className="mt-4">
                <Link href={routes.faq}>Check the FAQ first</Link>
              </Button>
            </div>
          </aside>
        </div>
      </Section>

      <JsonLd
        data={breadcrumbSchema([
          { label: "Home", href: routes.home },
          { label: "Contact", href: routes.contact },
        ])}
      />
    </>
  );
}
