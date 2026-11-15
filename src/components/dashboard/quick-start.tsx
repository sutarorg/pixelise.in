import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { MarketingImage } from "@/components/shared/marketing-image";
import { SectionCard } from "@/components/app/section-card";
import { defaultStyles, styleArtwork } from "@/config/studio";

/**
 * The three supported photography styles, with the artwork Pixelise produced in
 * its own studio. Each card deep-links into the studio with that style already
 * selected.
 */
export function QuickStart({ styles = defaultStyles }: { styles?: typeof defaultStyles }) {
  return (
    <SectionCard
      title="Start with a style"
      description="Every style is included in both credit packs."
      headingId="quick-start-heading"
      bodyClassName="p-3 sm:p-4"
    >
      <ul className="grid gap-3 sm:grid-cols-3">
        {styles.map((style) => (
          <li key={style.id}>
            <Link
              href={`/studio?style=${encodeURIComponent(style.id)}`}
              className="group block overflow-hidden rounded-[12px] border border-line bg-white transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-violet/25 hover:shadow-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet"
            >
              <span className="relative block aspect-[16/10] w-full overflow-hidden bg-surface">
                <MarketingImage
                  imageKey={styleArtwork[style.id] ?? "styleStudio"}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 90vw, (max-width: 1024px) 30vw, 22rem"
                  imageClassName="transition-transform duration-500 ease-out group-hover:scale-[1.02]"
                />
              </span>
              <span className="flex items-start justify-between gap-2 px-3 py-2.5">
                <span className="min-w-0">
                  <span className="block text-[0.84375rem] font-bold text-ink">{style.name}</span>
                  <span className="mt-0.5 block text-[0.71875rem] leading-[1.45] text-muted">
                    {style.summary}
                  </span>
                </span>
                <ArrowUpRight
                  className="mt-0.5 size-3.5 shrink-0 text-muted transition-colors group-hover:text-violet-ink"
                  strokeWidth={2.2}
                  aria-hidden="true"
                />
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="px-1 pb-0.5 pt-2.5 text-[0.6875rem] text-muted">
        Artwork created in the Pixelise studio.
      </p>
    </SectionCard>
  );
}
