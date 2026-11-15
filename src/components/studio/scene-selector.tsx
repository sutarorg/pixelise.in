"use client";

import {
  Check,
  Gem,
  Leaf,
  Sparkles,
  Square,
  TreePine,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { StudioScene } from "@/lib/api/types";

const sceneIcons: { match: RegExp; icon: LucideIcon }[] = [
  { match: /white|studio/i, icon: Square },
  { match: /beige|luxury-studio/i, icon: Sparkles },
  { match: /botanical|plant|natural/i, icon: Leaf },
  { match: /wood|oak|surface/i, icon: TreePine },
  { match: /marble|stone/i, icon: Gem },
  { match: /dramatic|light/i, icon: Zap },
];

function iconFor(scene: StudioScene): LucideIcon {
  return sceneIcons.find((entry) => entry.match.test(scene.id))?.icon ?? Sparkles;
}

/**
 * Scene choice for the selected style. Options come from the studio config —
 * the UI never invents a scene the service cannot render.
 */
export function SceneSelector({
  scenes,
  value,
  onChange,
  disabled,
}: {
  scenes: StudioScene[];
  value: string | null;
  onChange: (id: string) => void;
  disabled?: boolean;
}) {
  if (scenes.length === 0) {
    return (
      <p className="rounded-[10px] border border-dashed border-line-strong bg-surface px-3 py-4 text-center text-[0.75rem] leading-[1.5] text-muted">
        No scenes are configured for this style yet. Pick another style, or check back once the
        studio service has published its scene list.
      </p>
    );
  }

  return (
    <fieldset disabled={disabled} className="min-w-0">
      <legend className="sr-only">Scene</legend>
      <div className="grid max-h-[19rem] grid-cols-1 gap-2 overflow-y-auto pr-0.5 sm:grid-cols-2 lg:max-h-none lg:overflow-visible">
        {scenes.map((scene) => {
          const selected = value === scene.id;
          const Icon = iconFor(scene);
          return (
            <label
              key={scene.id}
              className={cn(
                "group relative flex cursor-pointer items-start gap-2 rounded-[10px] border p-2.5",
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
                name="studio-scene"
                value={scene.id}
                checked={selected}
                onChange={() => onChange(scene.id)}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className={cn(
                  "mt-px grid size-6 shrink-0 place-items-center rounded-[6px] border",
                  selected
                    ? "border-violet/25 bg-white text-violet"
                    : "border-line bg-surface text-muted",
                )}
              >
                <Icon className="size-3.5" strokeWidth={1.9} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span className="text-[0.75rem] font-bold leading-tight text-ink">
                    {scene.name}
                  </span>
                  {selected ? (
                    <Check className="size-3 shrink-0 text-violet" strokeWidth={3} aria-hidden="true" />
                  ) : null}
                </span>
                <span className="mt-0.5 block text-[0.6875rem] leading-[1.45] text-muted">
                  {scene.description}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
