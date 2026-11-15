"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { Logo } from "@/components/layout/logo";
import { MobileNav } from "@/components/layout/mobile-nav";
import { ResourcesMenu } from "@/components/layout/resources-menu";
import { primaryNav } from "@/config/navigation";
import { links } from "@/config/site";

export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 bg-canvas/85 backdrop-blur-xl backdrop-saturate-150",
        "transition-[border-color,box-shadow] duration-200",
        scrolled
          ? "border-b border-line shadow-[0_1px_0_rgb(255_255_255_/_0.9),0_8px_24px_-24px_rgb(21_21_44_/_0.45)]"
          : "border-b border-transparent",
      )}
    >
      <Container>
        <div className="flex h-16 items-center justify-between gap-4 lg:grid lg:grid-cols-[1fr_auto_1fr]">
          <div className="flex items-center">
            <Logo />
          </div>

          <nav aria-label="Main" className="hidden lg:block">
            <ul className="flex items-center gap-0.5">
              {primaryNav.map((item) => {
                const active =
                  pathname === item.href ||
                  item.children?.some((child) => child.href === pathname);

                return (
                  <li key={item.label}>
                    {item.children?.length ? (
                      <ResourcesMenu item={item} active={Boolean(active)} />
                    ) : (
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "relative inline-flex rounded-lg px-3 py-2 text-[0.875rem] font-semibold",
                          "tracking-[-0.005em] transition-colors hover:bg-ink/[0.04]",
                          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet",
                          active ? "text-ink" : "text-ink-soft hover:text-ink",
                        )}
                      >
                        {item.label}
                        {active ? (
                          <span
                            aria-hidden="true"
                            className="absolute inset-x-3 -bottom-px h-[2px] rounded-full bg-violet"
                          />
                        ) : null}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex items-center justify-end gap-1.5">
            <Link
              href={links.login}
              className={cn(
                "hidden rounded-lg px-3 py-2 text-[0.875rem] font-semibold text-ink-soft",
                "transition-colors hover:bg-ink/[0.04] hover:text-ink sm:inline-flex",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet",
              )}
            >
              Log in
            </Link>
            <Button asChild size="sm" className="hidden sm:inline-flex">
              <Link href={links.getStarted}>Get started</Link>
            </Button>
            <div className="lg:hidden">
              <MobileNav />
            </div>
          </div>
        </div>
      </Container>
    </header>
  );
}
