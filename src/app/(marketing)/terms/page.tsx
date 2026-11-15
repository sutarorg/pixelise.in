import type { Metadata } from "next";
import Link from "next/link";

import { LegalPage, type PolicySection } from "@/components/marketing/legal-page";
import { pageMetadata } from "@/lib/seo/metadata";
import { formatPrice, pricingPacks } from "@/config/pricing";
import { routes } from "@/config/site";

export const metadata: Metadata = pageMetadata({
  title: "Terms of Service",
  description:
    "The terms that apply to using the Pixelise website, the two one-time credit packs, your product photos, AI-generated output and acceptable use.",
  path: routes.terms,
});

const creator = pricingPacks[0];
const studio = pricingPacks[1];

const sections: readonly PolicySection[] = [
  {
    id: "agreement",
    heading: "Agreement to these terms",
    content: (
      <p>
        These terms apply to your use of the Pixelise public website and to any
        Pixelise credit pack you purchase. By using the site you accept them. If
        you do not accept them, please do not use the site.
      </p>
    ),
  },
  {
    id: "service",
    heading: "What Pixelise is",
    content: (
      <>
        <p>
          Pixelise is an AI product photography studio. You provide a photo of a
          product and the studio renders professional studio, lifestyle and
          advertising visuals around it.
        </p>
        <p>
          This website describes the product and publishes its pricing. The studio
          workspace — accounts, credits and image generation — runs as a separate
          application. Where a page on this site describes studio behaviour, it
          describes how the product is designed to work, not a simulation of it.
        </p>
      </>
    ),
  },
  {
    id: "packs",
    heading: "Credit packs and pricing",
    content: (
      <>
        <p>Pixelise sells two credit packs, both as one-time purchases:</p>
        <ul>
          <li>
            {creator.name}: {formatPrice(creator.price)} for {creator.credits} credits.
          </li>
          <li>
            {studio.name}: {formatPrice(studio.price)} for {studio.credits} credits.
          </li>
        </ul>
        <p>
          Prices are shown in Indian rupees. Any applicable taxes, and how they are
          displayed, are stated at checkout before you pay. Purchase and payment
          are handled by the studio application, not by this website.
        </p>
      </>
    ),
  },
  {
    id: "no-subscription",
    heading: "No subscription, no auto-renewal",
    content: (
      <p>
        A credit pack is a single purchase. Pixelise does not sell monthly plans,
        does not keep a card on file for recurring charges, and does not renew a
        pack automatically. Buying another pack is always a separate, explicit
        purchase.
      </p>
    ),
  },
  {
    id: "your-content",
    heading: "Your product photos and your account",
    content: (
      <>
        <p>
          You are responsible for the photos you upload. By uploading a product
          photo you confirm that you have the right to use it and to create
          derivative visuals from it.
        </p>
        <p>
          You keep the rights you hold in your own product photography. We do not
          claim ownership of the photos you upload, and we use them to produce the
          visuals you ask for rather than for anything else.
        </p>
        <p>
          You are also responsible for keeping your account credentials private
          once accounts open.
        </p>
      </>
    ),
  },
  {
    id: "ai-output",
    heading: "AI-generated output",
    content: (
      <p>
        Generated visuals are produced by AI and can vary between generations,
        even with the same inputs. The studio is built to preserve a product&apos;s
        shape, label and finish, but we cannot guarantee that any single render is
        an exact reproduction. Review every image before you publish it, and make
        sure it accurately represents the product you are selling.
      </p>
    ),
  },
  {
    id: "acceptable-use",
    heading: "Acceptable use",
    content: (
      <>
        <p>You agree not to use Pixelise to:</p>
        <ul>
          <li>
            upload or create content that is unlawful, infringing, deceptive or
            harmful;
          </li>
          <li>
            misrepresent a product in a way that would mislead a buyer about what
            they are purchasing;
          </li>
          <li>
            attempt to break, overload or reverse engineer the service, or access
            accounts and data that are not yours.
          </li>
        </ul>
        <p>
          We may suspend access where these limits are clearly breached, and where
          the law requires us to act.
        </p>
      </>
    ),
  },
  {
    id: "availability",
    heading: "Availability and changes",
    content: (
      <p>
        Features, photography styles and pricing pages may change as the product
        develops. We aim to keep published pricing accurate; where a price changes,
        the new price applies to purchases made after the change. The site may be
        unavailable occasionally for maintenance or because of a fault.
      </p>
    ),
  },
  {
    id: "liability",
    heading: "Liability",
    content: (
      <p>
        The site is provided as it is. To the extent permitted by law, Pixelise is
        not liable for indirect or consequential losses arising from use of this
        website. Nothing in these terms limits or excludes rights you have under
        applicable consumer protection law.
      </p>
    ),
  },
  {
    id: "law",
    heading: "Governing law",
    content: (
      <p>
        These terms are governed by the laws of India, and disputes are subject to
        the jurisdiction of Indian courts.
      </p>
    ),
  },
  {
    id: "contact",
    heading: "Questions about these terms",
    content: (
      <p>
        Write to us through the{" "}
        <Link href={routes.contact}>contact page</Link>. For purchases, refunds and
        what applies to them, see the{" "}
        <Link href={routes.refund}>refund policy</Link>.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of service"
      path={routes.terms}
      lead="The rules that apply to this website and to the two one-time credit packs, written to be read rather than skimmed."
      updated="15 November 2026"
      sections={sections}
    />
  );
}
