"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { MarketingImage } from "@/components/shared/marketing-image";
import { styleArtwork } from "@/config/studio";
import type { PhotographyStyle } from "@/lib/api/types";

/**
 * Style choice as a real radio group: arrow keys move between options, the
 * whole card is the target, and selection is never conveyed by colour alone
 * (a check icon appears as well).
 */
export function PhotographyStyleSelector({
  styles,
  value,
  onChange,
  disabled,
}: {
  styles: PhotographyStyle[];
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}) {
  return (
    <fieldset disabled={disabled} className="min-w-0">
      <legend className="sr-only">Photography style</legend>
      <div className="grid gap-2">
        {styles.map((style) => {
          const selected = value === style.id;
          return (
            <label
              key={style.id}
              className={cn(
                "group relative flex cursor-pointer items-center gap-3 rounded-[10px] border p-2",
                "transition-[border-color,background-color,box-shadow] duration-150",
                "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-violet",
                selected
                  ? "border-violet bg-tint shadow-[inset_0_0_0_1px_rgb(96_69_245_/_0.18)]"
                  : "border-line bg-white hover:border-line-strong",
                disabled && "cursor-not-allowed opacity-70",
              )}
            >
              <input
                type="radio"
                name="photography-style"
                value={style.id}
                checked={selected}
                onChange={() => onChange(style.id)}
                className="sr-only"
              />
              <span className="relative block size-14 shrink-0 overflow-hidden rounded-[8px] border border-line bg-surface">
                <MarketingImage
                  imageKey={styleArtwork[style.id] ?? "styleStudio"}
                  alt=""
                  fill
                  sizes="56px"
                  imageClassName="object-cover"
                />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span className="text-[0.8125rem] font-bold text-ink">{style.name}</span>
                  <span
                    aria-hidden="true"
                    className={cn(
                      "grid size-4 place-items-center rounded-full bg-violet text-white transition-opacity",
                      selected ? "opacity-100" : "opacity-0",
                    )}
                  >
                    <Check className="size-2.5" strokeWidth={3.2} />
                  </span>
                </span>
                <span className="mt-0.5 block text-[0.71875rem] leading-[1.45] text-muted">
                  {style.summary}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
