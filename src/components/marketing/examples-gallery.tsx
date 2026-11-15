"use client";

import * as React from "react";

import { MarketingImage } from "@/components/shared/marketing-image";
import { galleryFilters, galleryItems, type GalleryFilterId } from "@/config/gallery";
import { cn } from "@/lib/utils";

export function ExamplesGallery() {
  const [filter, setFilter] = React.useState<GalleryFilterId>("all");
  const items =
    filter === "all" ? galleryItems : galleryItems.filter((item) => item.style === filter);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div
          role="group"
          aria-label="Filter examples by photography style"
          className="flex flex-wrap items-center gap-2"
        >
          {galleryFilters.map((option) => {
            const active = filter === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setFilter(option.id)}
                aria-pressed={active}
                className={cn(
                  "cursor-pointer rounded-full border px-3.5 py-2 text-[0.8125rem] font-semibold",
                  "transition-[background-color,border-color,color] duration-150",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet",
                  active
                    ? "border-violet bg-violet text-white"
                    : "border-line-strong bg-white text-ink-soft hover:border-ink/25 hover:text-ink",
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
        <p aria-live="polite" className="text-[0.8125rem] text-muted">
          Showing <span className="font-semibold text-ink-soft">{items.length}</span> of{" "}
          {galleryItems.length} images
        </p>
      </div>

      <ul className="mt-8 grid gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <li key={item.id}>
            <figure className="group">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
                <MarketingImage
                  imageKey={item.image}
                  alt={item.alt}
                  sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
                  fill
                  imageClassName="object-cover transition-transform duration-[600ms] ease-out group-hover:scale-[1.03]"
                />
                <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[0.625rem] font-bold uppercase tracking-[0.14em] text-ink/75 ring-1 ring-ink/[0.06] backdrop-blur-sm">
                  {item.style}
                </span>
              </div>
              <figcaption className="mt-4">
                <h3 className="text-[0.9375rem] font-bold tracking-[-0.015em] text-ink">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-[0.8125rem] leading-[1.55] text-muted">
                  {item.description}
                </p>
                <p className="text-eyebrow mt-3 text-[0.625rem] text-muted/80">
                  {item.category}
                </p>
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </div>
  );
}
