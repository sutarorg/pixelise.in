import type { Metadata } from "next";
import Link from "next/link";

import { LegalPage, type PolicySection } from "@/components/marketing/legal-page";
import { pageMetadata } from "@/lib/seo/metadata";
import { pricingPacks } from "@/config/pricing";
import { routes } from "@/config/site";

export const metadata: Metadata = pageMetadata({
  title: "Refund Policy",
  description:
    "How refunds work for Pixelise one-time credit packs: what happens if credits are not delivered, if a generation fails, and how to make a request.",
  path: routes.refund,
});

const sections: readonly PolicySection[] = [
  {
    id: "scope",
    heading: "What this policy applies to",
    content: (
      <>
        <p>
          This policy applies to Pixelise credit packs: {pricingPacks[0].name} and{" "}
          {pricingPacks[1].name}. Both are one-time purchases of credits.
        </p>
        <p>
          Credit checkout does not run on this website today. This page describes
          how refunds are handled for a credit pack purchase, and is reviewed
          before checkout opens.
        </p>
      </>
    ),
  },
  {
    id: "no-subscription",
    heading: "There is no subscription to cancel",
    content: (
      <p>
        Because a pack is bought once, there is no recurring charge, no renewal
        date and no cancellation process. If you do not buy another pack, you are
        not charged again.
      </p>
    ),
  },
  {
    id: "not-delivered",
    heading: "If a payment succeeds but credits do not arrive",
    content: (
      <p>
        If money has left your account and the credits have not been added to your
        balance, you are entitled to a full refund of that payment, or to the
        credits being added — whichever you prefer. This applies whether the cause
        was a failed confirmation, a duplicate charge or a technical fault.
      </p>
    ),
  },
  {
    id: "failed-generation",
    heading: "If a generation fails",
    content: (
      <p>
        If a generation fails because of a fault on our side, the credits for that
        generation are returned to your balance. Credits that have been spent
        successfully on a delivered image are not refunded automatically, and
        requests outside that are looked at individually.
      </p>
    ),
  },
  {
    id: "requests",
    heading: "How to make a request",
    content: (
      <>
        <p>
          Refund requests go through the{" "}
          <Link href={routes.contact}>contact page</Link>. Include the pack you
          bought, the approximate date, and what went wrong. We will acknowledge
          the request and confirm the next steps in writing.
        </p>
        <p>
          Approved refunds are returned to the original payment method. Your bank
          or payment provider then controls how long the money takes to appear.
        </p>
      </>
    ),
  },
  {
    id: "rights",
    heading: "Your statutory rights",
    content: (
      <p>
        Nothing in this policy limits or excludes any right you have under
        applicable consumer protection law in India, including the Consumer
        Protection Act, 2019 and the e-commerce rules that apply to digital
        purchases.
      </p>
    ),
  },
  {
    id: "changes",
    heading: "Changes to this policy",
    content: (
      <p>
        If this policy changes, the updated version is published here with a new
        date. A change never applies backwards to a purchase you have already
        made.
      </p>
    ),
  },
];

export default function RefundPolicyPage() {
  return (
    <LegalPage
      title="Refund policy"
      path={routes.refund}
      lead="Credit packs are one-time purchases. This page explains exactly what happens when a payment or a generation does not go to plan."
      updated="15 November 2026"
      sections={sections}
    />
  );
}
