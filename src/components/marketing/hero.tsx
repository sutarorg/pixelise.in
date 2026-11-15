import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { Eyebrow } from "@/components/shared/eyebrow";
import { IconArrowRight, IconCheck } from "@/components/shared/icons";
import { HeroComposition } from "@/components/marketing/hero-composition";
import { heroBenefits } from "@/config/content";
import { links } from "@/config/site";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(75%_100%_at_72%_0%,#F6F3FF_0%,#FCFBFF_52%,#FFFFFF_100%)]"
      />
      <Container className="relative pb-16 pt-10 sm:pt-14 lg:pb-24 lg:pt-16">
        <div className="grid items-center gap-12 lg:grid-cols-[43fr_57fr] lg:gap-10 xl:gap-14">
          <div className="max-w-[38rem] animate-rise lg:max-w-none">
            <Eyebrow>AI product photography studio</Eyebrow>

            <h1 className="text-display mt-5 text-ink">
              Transform ordinary product photos into{" "}
              <span className="text-violet">extraordinary</span> visuals.
            </h1>

            <p className="text-lead mt-6 max-w-[34rem] text-muted-strong">
              Create professional studio, lifestyle and advertising photos for
              your products in seconds. Made for Shopify stores, D2C brands and
              ecommerce sellers.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="group">
                <Link href={links.getStarted}>
                  Get started
                  <IconArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href={links.examples}>Explore examples</Link>
              </Button>
            </div>

            <ul className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3">
              {heroBenefits.map((benefit) => (
                <li
                  key={benefit}
                  className="flex items-center gap-2 text-[0.8125rem] font-medium text-muted-strong"
                >
                  <IconCheck className="size-[0.95rem] shrink-0 text-violet" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          <div className="animate-rise-late">
            <HeroComposition />
          </div>
        </div>
      </Container>
    </section>
  );
}
