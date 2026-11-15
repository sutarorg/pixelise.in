import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState, ErrorState } from "@/components/app/state-views";
import { CreationsFilters } from "@/components/creations/creations-filters";
import { CreationsBrowser } from "@/components/creations/creations-browser";
import { GenerationCardSkeleton } from "@/components/creations/generation-card";
import { getGenerations } from "@/lib/api/server";
import { defaultStyles } from "@/config/studio";

export const metadata: Metadata = {
  title: "My creations",
  description: "Every visual you have generated, with its style, scene and download.",
};

const styleIds = defaultStyles.map((style) => style.id);

export default function CreationsPage({
  searchParams,
}: {
  searchParams: Promise<{ style?: string; sort?: string; cursor?: string }>;
}) {
  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeader
        title="My creations"
        description="Everything the studio has produced for you, newest first. Filter by style, open a visual for its details, or download it directly."
        actions={
          <Button asChild size="sm">
            <Link href="/studio">
              <Sparkles className="size-4" aria-hidden="true" />
              New visual
            </Link>
          </Button>
        }
      />

      <Suspense fallback={<CreationsSkeleton />}>
        <CreationsContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function CreationsContent({
  searchParams,
}: {
  searchParams: Promise<{ style?: string; sort?: string; cursor?: string }>;
}) {
  const params = await searchParams;
  const style = params.style && styleIds.includes(params.style) ? params.style : "all";
  const sort = params.sort === "oldest" ? "oldest" : "newest";

  const result = await getGenerations({ style, sort, cursor: params.cursor, limit: "24" });

  if (!result.ok) {
    return (
      <div className="rounded-[var(--radius-card)] border border-line bg-white shadow-card">
        <ErrorState
          error={result.error}
          title="Your creations are unavailable"
          description={
            result.error.code === "not_configured"
              ? "Generated visuals appear here once this workspace is connected to the Pixelise service."
              : undefined
          }
          action={
            <Button asChild size="sm">
              <Link href="/studio">Open AI Studio</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const { items, nextCursor, total } = result.data;

  if (items.length === 0) {
    return (
      <div className="rounded-[var(--radius-card)] border border-line bg-white shadow-card">
        {style === "all" ? (
          <EmptyState
            icon={Sparkles}
            title="No creations yet"
            description="Your first visual will land here with its style, scene and source photo. It takes one product photo to start."
            action={
              <Button asChild size="sm">
                <Link href="/studio">
                  <Sparkles className="size-4" aria-hidden="true" />
                  Open AI Studio
                </Link>
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={Sparkles}
            tone="neutral"
            title={`No ${style} visuals yet`}
            description="Nothing has been generated in this style. Try another filter, or create the first one."
            action={
              <Button asChild size="sm" variant="secondary">
                <Link href="/creations">Show all creations</Link>
              </Button>
            }
            secondaryAction={
              <Button asChild size="sm">
                <Link href={`/studio?style=${style}`}>Create in {style}</Link>
              </Button>
            }
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <CreationsFilters style={style} sort={sort} count={total ?? items.length} />
      <CreationsBrowser
        initialItems={items}
        initialCursor={nextCursor}
        style={style}
        sort={sort}
      />
    </div>
  );
}

function CreationsSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-14 w-full rounded-[12px]" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <GenerationCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}
