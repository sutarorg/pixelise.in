"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import type { AspectRatioOption, QualityOption } from "@/lib/api/types";

/**
 * Output settings, in customer language. Both groups are radio groups so
 * arrow-key navigation works and the selected option is announced. Pixel sizes
 * are guidance for the preview frame only — the service decides the final
 * output and its cost.
 */
export function GenerationSettings({
  aspectRatios,
  qualities,
  aspectRatioId,
  qualityId,
  onAspectRatioChange,
  onQualityChange,
  disabled,
}: {
  aspectRatios: AspectRatioOption[];
  qualities: QualityOption[];
  aspectRatioId: string;
  qualityId: string;
  onAspectRatioChange: (id: string) => void;
  onQualityChange: (id: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-4">
      <fieldset disabled={disabled} className="min-w-0">
        <legend className="mb-2 text-[0.75rem] font-semibold text-ink">Aspect ratio</legend>
        <div className="grid grid-cols-2 gap-2">
          {aspectRatios.map((ratio) => {
            const selected = ratio.id === aspectRatioId;
            return (
              <label
                key={ratio.id}
                className={cn(
                  "relative flex cursor-pointer items-center gap-2 rounded-[10px] border px-2.5 py-2",
                  "transition-[border-color,background-color] duration-150",
                  "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-violet",
                  selected
                    ? "border-violet bg-tint shadow-[inset_0_0_0_1px_rgb(96_69_245_/_0.18)]"
                    : "border-line bg-white hover:border-line-strong",
                  disabled && "cursor-not-allowed opacity-70",
                )}
              >
                <input
                  type="radio"
                  name="aspect-ratio"
                  value={ratio.id}
                  checked={selected}
                  onChange={() => onAspectRatioChange(ratio.id)}
                  className="sr-only"
                />
                <RatioGlyph width={ratio.width} height={ratio.height} selected={selected} />
                <span className="min-w-0">
                  <span className="block text-[0.75rem] font-bold leading-tight text-ink">
                    {ratio.label}
                  </span>
                  <span className="mt-0.5 block truncate text-[0.65625rem] text-muted">
                    {ratio.description}
                  </span>
                </span>
                {selected ? (
                  <Check
                    className="ml-auto size-3 shrink-0 text-violet"
                    strokeWidth={3}
                    aria-hidden="true"
                  />
                ) : null}
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset disabled={disabled} className="min-w-0">
        <legend className="mb-2 text-[0.75rem] font-semibold text-ink">Quality</legend>
        <div className="grid gap-2">
          {qualities.map((quality) => {
            const selected = quality.id === qualityId;
            return (
              <label
                key={quality.id}
                className={cn(
                  "flex cursor-pointer items-start gap-2.5 rounded-[10px] border p-2.5",
                  "transition-[border-color,background-color] duration-150",
                  "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-violet",
                  selected
                    ? "border-violet bg-tint shadow-[inset_0_0_0_1px_rgb(96_69_245_/_0.18)]"
                    : "border-line bg-white hover:border-line-strong",
                  disabled && "cursor-not-allowed opacity-70",
                )}
              >
                <input
                  type="radio"
                  name="quality"
                  value={quality.id}
                  checked={selected}
                  onChange={() => onQualityChange(quality.id)}
                  className="sr-only"
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="text-[0.75rem] font-bold text-ink">{quality.label}</span>
                    {selected ? (
                      <Check className="size-3 text-violet" strokeWidth={3} aria-hidden="true" />
                    ) : null}
                    {quality.credits !== null ? (
                      <span className="ml-auto text-[0.6875rem] font-semibold tabular-nums text-muted">
                        {quality.credits} credits
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-0.5 block text-[0.6875rem] leading-[1.45] text-muted">
                    {quality.description}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
        <p className="mt-2 text-[0.65625rem] leading-[1.5] text-muted">
          Final pixel dimensions are set by the studio service, not the browser.
        </p>
      </fieldset>
    </div>
  );
}

function RatioGlyph({
  width,
  height,
  selected,
}: {
  width: number;
  height: number;
  selected: boolean;
}) {
  const landscape = width >= height;
  const ratio = landscape ? width / height : height / width;
  const box = 18;
  const w = landscape ? box : Math.max(8, Math.round(box / Math.min(ratio, 2.2)));
  const h = landscape ? Math.max(8, Math.round(box / Math.min(ratio, 2.2))) : box;

  return (
    <span
      aria-hidden="true"
      className="grid size-[18px] shrink-0 place-items-center"
    >
      <span
        className={cn(
          "block rounded-[2px] border",
          selected ? "border-violet bg-violet/20" : "border-line-strong bg-surface",
        )}
        style={{ width: w, height: h }}
      />
    </span>
  );
}
