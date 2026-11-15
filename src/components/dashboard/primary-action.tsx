import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/shared/eyebrow";
import { MarketingImage } from "@/components/shared/marketing-image";

/**
 * The dashboard's one big action. The artwork beside it is Pixelise studio
 * artwork — it demonstrates the three looks the studio produces, and is never
 * presented as a customer's creation.
 */
export function PrimaryAction() {
  return (
    <section className="relative overflow-hidden rounded-[var(--radius-card)] border border-violet/15 bg-tint shadow-card">
      <div className="flex flex-col gap-6 p-5 sm:p-6 lg:flex-row lg:items-center lg:gap-8">
        <div className="min-w-0 flex-1">
          <Eyebrow>AI Studio</Eyebrow>
          <h2 className="mt-2.5 text-[1.625rem] font-extrabold leading-[1.15] tracking-[-0.035em] text-ink sm:text-[1.875rem]">
            Create product photos
          </h2>
          <p className="mt-2 max-w-[48ch] text-[0.875rem] leading-[1.65] text-muted-strong">
            Upload one photo of your product, choose a photography style and a scene, and
            download a visual you can list today. No studio, no scheduling.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Button asChild size="md">
              <Link href="/studio">
                <Sparkles className="size-4" aria-hidden="true" />
                Create product photos
              </Link>
            </Button>
            <Button asChild size="md" variant="secondary">
              <Link href="/how-it-works">
                See how it works
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>

        <div
          aria-hidden="true"
          className="hidden shrink-0 items-end gap-2.5 pb-1 sm:flex lg:pr-1"
        >
          <span className="block w-[4.5rem] -rotate-6 overflow-hidden rounded-[10px] border border-white/70 shadow-lift">
            <MarketingImage
              imageKey="previewStudio"
              alt=""
              sizes="72px"
              className="aspect-square object-cover"
            />
          </span>
          <span className="block w-[5.5rem] overflow-hidden rounded-[12px] border border-white/70 shadow-lift">
            <MarketingImage
              imageKey="previewLifestyle"
              alt=""
              sizes="88px"
              className="aspect-square object-cover"
            />
          </span>
          <span className="block w-[4.5rem] rotate-6 overflow-hidden rounded-[10px] border border-white/70 shadow-lift">
            <MarketingImage
              imageKey="previewAdvertising"
              alt=""
              sizes="72px"
              className="aspect-square object-cover"
            />
          </span>
        </div>
      </div>
    </section>
  );
}
