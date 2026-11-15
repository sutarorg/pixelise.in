import Link from "next/link";

import { Container } from "@/components/layout/container";
import { Logo } from "@/components/layout/logo";
import { footerNav } from "@/config/navigation";
import { siteConfig } from "@/config/site";

export function SiteFooter() {
  return (
    <footer className="bg-footer text-footer-text">
      <Container>
        <div className="grid gap-12 py-14 lg:grid-cols-[1.15fr_2.6fr] lg:gap-20 lg:py-20">
          <div>
            <Logo tone="inverse" />
            <p className="mt-6 max-w-[27rem] text-[0.9375rem] leading-[1.72]">
              Pixelise is an AI product photography studio for modern ecommerce.
              Upload a product photo and create studio, lifestyle and advertising
              visuals — without arranging a photoshoot.
            </p>
            <p className="mt-6 inline-flex flex-wrap items-center gap-x-2 gap-y-1 rounded-full border border-footer-line px-3.5 py-2 text-[0.75rem] text-white/75">
              <span className="font-semibold text-white">Creator ₹499</span>
              <span aria-hidden="true" className="text-white/25">
                /
              </span>
              <span className="font-semibold text-white">Studio ₹999</span>
              <span className="text-white/50">one-time packs</span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4">
            {footerNav.map((group) => (
              <nav key={group.title} aria-label={group.title}>
                <h2 className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-white/45">
                  {group.title}
                </h2>
                <ul className="mt-4 space-y-2.5">
                  {group.links.map((link) => (
                    <li key={`${group.title}-${link.href}-${link.label}`}>
                      <Link
                        href={link.href}
                        className="rounded text-[0.875rem] transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-footer-line py-6 text-[0.8125rem] sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {siteConfig.copyrightYear} {siteConfig.legalName}. All rights reserved.
          </p>
          <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <li>
              <Link href="/privacy" className="transition-colors hover:text-white">
                Privacy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="transition-colors hover:text-white">
                Terms
              </Link>
            </li>
            <li>
              <Link href="/refund-policy" className="transition-colors hover:text-white">
                Refund policy
              </Link>
            </li>
            <li>
              <a href="/sitemap.xml" className="transition-colors hover:text-white">
                Sitemap
              </a>
            </li>
          </ul>
        </div>
      </Container>
    </footer>
  );
}
