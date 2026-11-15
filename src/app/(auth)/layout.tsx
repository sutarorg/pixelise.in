import type { Metadata } from "next";
import Link from "next/link";

import { Logo } from "@/components/layout/logo";
import { SkipLink } from "@/components/layout/skip-link";
import { routes, siteConfig } from "@/config/site";

/**
 * Frame for the three account-entry pages.
 *
 * No marketing header or footer: a customer arriving here is mid-task, and the
 * public navigation is one link away. The segment is noindex — `robots.txt`
 * already disallows these prefixes, and this keeps a stray crawler out too.
 */

export const metadata: Metadata = {
  title: {
    default: "Account",
    template: "%s | Pixelise",
  },
  robots: { index: false, follow: false, nocache: true },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <SkipLink />

      <header className="px-5 py-5 sm:px-8">
        <div className="mx-auto w-full max-w-[var(--container-page)]">
          <Logo />
        </div>
      </header>

      <main
        id="main"
        className="flex flex-1 items-start justify-center px-5 pb-14 pt-2 sm:items-center sm:px-8 sm:pb-20"
      >
        {children}
      </main>

      <footer className="px-5 pb-8 text-center text-[0.75rem] leading-[1.6] text-muted sm:px-8">
        <p>
          © {siteConfig.copyrightYear} Pixelise ·{" "}
          <Link href={routes.privacy} className="underline decoration-line-strong underline-offset-2 hover:text-ink">
            Privacy
          </Link>{" "}
          ·{" "}
          <Link href={routes.terms} className="underline decoration-line-strong underline-offset-2 hover:text-ink">
            Terms
          </Link>{" "}
          ·{" "}
          <Link href={routes.refund} className="underline decoration-line-strong underline-offset-2 hover:text-ink">
            Refunds
          </Link>
        </p>
      </footer>
    </div>
  );
}
