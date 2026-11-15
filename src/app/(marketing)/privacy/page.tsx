import type { Metadata } from "next";
import Link from "next/link";

import { LegalPage, type PolicySection } from "@/components/marketing/legal-page";
import { pageMetadata } from "@/lib/seo/metadata";
import { routes } from "@/config/site";

export const metadata: Metadata = pageMetadata({
  title: "Privacy Policy",
  description:
    "What the Pixelise public website collects, why, and what it does not do — including cookies, hosting logs and the support form that is not yet enabled.",
  path: routes.privacy,
});

const sections: readonly PolicySection[] = [
  {
    id: "scope",
    heading: "What this policy covers",
    content: (
      <>
        <p>
          This policy covers the public Pixelise website at pixelise.in. It
          explains the small amount of information this site handles while you
          read about the product, browse examples or check pricing.
        </p>
        <p>
          The Pixelise studio — accounts, credit purchases and image generation —
          is delivered as a separate application. It is not live on this domain
          today, and when it opens it will be covered by its own notice covering
          account data, payment data and the product photos you upload.
        </p>
      </>
    ),
  },
  {
    id: "information",
    heading: "Information this site handles",
    content: (
      <>
        <p>There are only two ways information is involved when you use this site.</p>
        <ul>
          <li>
            <strong>Technical request data.</strong> Our hosting provider records
            standard server information for every request: an IP address, browser
            user agent, the page requested and a timestamp. This is ordinary web
            server logging, not profiling.
          </li>
          <li>
            <strong>Information you choose to send us.</strong> The support form
            on the contact page is not enabled yet and collects nothing. Once
            support opens, the details you submit — name, email address, topic and
            message — will be used only to answer your question.
          </li>
        </ul>
        <p>
          We do not run advertising or analytics trackers on this site, we do not
          build visitor profiles, and we do not ask for information we do not
          need.
        </p>
      </>
    ),
  },
  {
    id: "use",
    heading: "How information is used",
    content: (
      <ul>
        <li>To serve the pages you request and keep the site available.</li>
        <li>To detect and investigate abuse, errors and security incidents.</li>
        <li>To answer a support question, once support messaging is open.</li>
        <li>To meet legal obligations where they apply.</li>
      </ul>
    ),
  },
  {
    id: "cookies",
    heading: "Cookies and third parties",
    content: (
      <>
        <p>
          This site sets no advertising or analytics cookies. It does not embed
          third-party fonts, tracking pixels or social plugins: typefaces and
          images are served from this domain.
        </p>
        <p>
          Our hosting provider processes requests on our behalf in order to
          deliver the site. We do not sell or rent information to anyone.
        </p>
      </>
    ),
  },
  {
    id: "retention",
    heading: "How long information is kept",
    content: (
      <p>
        Server logs are kept for the retention period configured at our hosting
        provider and are not copied into a separate archive. Support
        correspondence, once support opens, is kept only for as long as it is
        needed to resolve the question and to keep a record of what was agreed.
      </p>
    ),
  },
  {
    id: "rights",
    heading: "Your choices and rights",
    content: (
      <>
        <p>
          You can ask what information we hold about you, ask for a correction, or
          ask for it to be deleted. Because this site does not create accounts, the
          only information that could be associated with you is a support message
          you have sent.
        </p>
        <p>
          Requests go through the{" "}
          <Link href={routes.contact}>contact page</Link>. Nothing in this policy
          limits rights you have under applicable data protection law.
        </p>
      </>
    ),
  },
  {
    id: "children",
    heading: "Children",
    content: (
      <p>
        Pixelise is a business tool intended for people running or working with an
        ecommerce business. It is not directed at children, and we do not
        knowingly collect information from them.
      </p>
    ),
  },
  {
    id: "changes",
    heading: "Changes to this policy",
    content: (
      <p>
        If this policy changes, the new version is published on this page with a
        new date. Material changes will be presented clearly rather than edited
        silently.
      </p>
    ),
  },
  {
    id: "contact",
    heading: "Contacting us",
    content: (
      <p>
        Questions about privacy can be raised through the{" "}
        <Link href={routes.contact}>contact page</Link>. A dedicated privacy
        contact address will be published alongside the studio launch.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy policy"
      path={routes.privacy}
      lead="A short, specific policy for a site that collects very little: hosting logs, and nothing else unless you choose to write to us."
      updated="15 November 2026"
      sections={sections}
    />
  );
}
