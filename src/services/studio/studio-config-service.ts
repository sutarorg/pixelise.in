import "server-only";

import type { StudioConfig } from "@/lib/api/types";
import {
  defaultAspectRatios,
  defaultQualities,
  defaultScenes,
  defaultStyles,
  uploadConstraints,
} from "@/config/generation";
import { createLogger } from "@/lib/logging";
import { getServiceClient } from "@/lib/supabase/service";

/**
 * Studio configuration, composed from the reviewed product constants plus the
 * pricing the owner has approved.
 *
 * A quality only shows a credit figure when every approved rate for it agrees.
 * Where rates differ by style — or none is approved yet — the figure is `null`,
 * which the studio renders as "not configured" instead of inventing a number.
 */

const log = createLogger("studio-config");

const hasDatabase = () => Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);

export async function getStudioConfig(): Promise<StudioConfig> {
  let creditsByQuality: Record<string, number | null> = {};

  if (hasDatabase()) {
    try {
      const supabase = getServiceClient();
      const { data } = await supabase
        .from("generation_pricing")
        .select("quality_id, credits, approved")
        .eq("approved", true);

      const grouped = new Map<string, Set<number>>();
      for (const row of (data ?? []) as Array<{ quality_id: string; credits: number }>) {
        const set = grouped.get(row.quality_id) ?? new Set<number>();
        set.add(Number(row.credits));
        grouped.set(row.quality_id, set);
      }

      creditsByQuality = Object.fromEntries(
        [...grouped.entries()].map(([qualityId, values]) => [
          qualityId,
          values.size === 1 ? [...values][0] : null,
        ]),
      );
    } catch (error) {
      log.warn("pricing read failed — showing unconfigured costs", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return {
    styles: defaultStyles,
    scenes: defaultScenes,
    aspectRatios: defaultAspectRatios,
    qualities: defaultQualities.map((quality) => ({
      ...quality,
      credits: creditsByQuality[quality.id] ?? null,
    })),
    maxUploadBytes: uploadConstraints.maxBytes,
    acceptedMimeTypes: [...uploadConstraints.acceptedMimeTypes],
  };
}
