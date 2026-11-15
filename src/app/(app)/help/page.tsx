import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpRight,
  CreditCard,
  FileText,
  LifeBuoy,
  ShieldCheck,
  Sparkles,
  Wand2,
} from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { SectionCard } from "@/components/app/section-card";

export const metadata: Metadata = {
  title: "Help & support",
  description: "Answers about the studio, credits and your account.",
};

const topics = [
  {
    href: "/studio",
    icon: Sparkles,
    title: "Using the studio",
    description: "Upload a photo, pick a style and scene, and understand what each control changes.",
  },
  {
    href: "/how-it-works",
    icon: Wand2,
    title: "How a visual is made",
    description: "What the studio does with your photo, and why a straight-on shot works best.",
  },
  {
    href: "/credits",
    icon: CreditCard,
    title: "Credits and packs",
    description: "Two one-time packs, how credits are reserved, and what a generation costs.",
  },
  {
    href: "/transactions",
    icon: FileText,
    title: "Receipts and history",
    description: "Every purchase, generation and refund with its date, amount and status.",
  },
  {
    href: "/refund-policy",
    icon: ShieldCheck,
    title: "Refunds",
    description: "What Pixelise does and does not refund, written in plain language.",
  },
  {
    href: "/contact",
    icon: LifeBuoy,
    title: "Contact",
    description: "How to reach the team while the support inbox is being set up.",
  },
];

export default function HelpPage() {
  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeader
        title="Help & support"
        description="Short answers, the policies behind them, and where to go when you need a person."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {topics.map((topic) => {
          const Icon = topic.icon;
          return (
            <Link
              key={topic.href}
              href={topic.href}
              className="group flex items-start gap-3 rounded-[var(--radius-card)] border border-line bg-white p-4 shadow-card transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-violet/25 hover:shadow-lift focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet"
            >
              <span
                aria-hidden="true"
                className="grid size-9 shrink-0 place-items-center rounded-[10px] border border-violet/15 bg-tint text-violet-ink"
              >
                <Icon className="size-4" strokeWidth={1.9} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span className="text-[0.84375rem] font-bold text-ink">{topic.title}</span>
                  <ArrowUpRight
                    className="size-3.5 text-muted transition-colors group-hover:text-violet-ink"
                    strokeWidth={2.2}
                    aria-hidden="true"
                  />
                </span>
                <span className="mt-1 block text-[0.75rem] leading-[1.55] text-muted-strong">
                  {topic.description}
                </span>
              </span>
            </Link>
          );
        })}
      </div>

      <SectionCard title="Talking to a person">
        <div className="space-y-2.5 px-4 py-4 text-[0.8125rem] leading-[1.65] text-muted-strong sm:px-5">
          <p>
            A monitored support inbox doesn&apos;t exist yet, so Pixelise doesn&apos;t publish an
            address it can&apos;t answer. The contact page explains what is available today and will
            carry the support details once the inbox is live.
          </p>
          <p className="text-[0.75rem] text-muted">
            For anything about a payment, keep the order id from your transaction history — it is
            the fastest way for the team to trace a charge.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Link
              href="/contact"
              className="inline-flex h-9 items-center rounded-[8px] border border-line-strong bg-white px-3.5 text-[0.8125rem] font-semibold text-ink hover:border-ink/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet"
            >
              Open contact page
            </Link>
            <Link
              href="/faq"
              className="inline-flex h-9 items-center rounded-[8px] border border-line-strong bg-white px-3.5 text-[0.8125rem] font-semibold text-ink hover:border-ink/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet"
            >
              Read the FAQ
            </Link>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
