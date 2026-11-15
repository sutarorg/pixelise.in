import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { Eyebrow } from "@/components/shared/eyebrow";
import { links } from "@/config/site";

export function FinalCta() {
  return (
    <section className="bg-canvas py-16 sm:py-20 lg:py-24">
      <Container>
        <div className="relative overflow-hidden rounded-[28px] bg-violet px-6 py-14 sm:px-10 lg:px-16 lg:py-20">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(75%_120%_at_88%_-10%,rgb(255_255_255_/_0.18)_0%,rgb(255_255_255_/_0)_58%)]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-16 -right-10 hidden grid-cols-2 gap-3 opacity-[0.14] lg:grid"
          >
            <span className="size-20 rounded-2xl border border-white" />
            <span className="size-20 rounded-2xl bg-white" />
            <span className="size-20 rounded-2xl bg-white" />
            <span className="size-20 rounded-2xl border border-white" />
          </div>

          <div className="relative max-w-[44rem]">
            <Eyebrow tone="inverse">Start your studio</Eyebrow>
            <h2 className="text-display-sm mt-5 text-white">
              Give your products the photography they deserve.
            </h2>
            <p className="text-lead mt-5 max-w-[34rem] text-white/85">
              Studio, lifestyle and advertising visuals from a photo you already
              have. Two credit packs, bought once.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" variant="inverse">
                <Link href={links.getStarted}>Get started with Pixelise</Link>
              </Button>
              <Button asChild size="lg" variant="inverseOutline">
                <Link href={links.examples}>Explore examples</Link>
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
