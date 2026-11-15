import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Images } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/app/page-header";
import { StudioWorkspace } from "@/components/studio/studio-workspace";
import { getStudioConfig, getWallet } from "@/lib/api/server";
import {
  defaultAspectRatios,
  defaultQualities,
  defaultScenes,
  defaultStyles,
} from "@/config/studio";

export const metadata: Metadata = {
  title: "AI Studio",
  description: "Upload a product photo and create a studio, lifestyle or advertising visual.",
};

export default function StudioPage({
  searchParams,
}: {
  searchParams: Promise<{ style?: string }>;
}) {
  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeader
        title="AI Studio"
        description="One product photo in, a finished visual out. Choose a style and a scene, check the cost, then generate."
        actions={
          <Button asChild size="sm" variant="secondary">
            <Link href="/creations">
              <Images className="size-4" aria-hidden="true" />
              My creations
            </Link>
          </Button>
        }
      />

      <Suspense fallback={<StudioSkeleton />}>
        <StudioLoader searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function StudioLoader({
  searchParams,
}: {
  searchParams: Promise<{ style?: string }>;
}) {
  const [configResult, wallet, params] = await Promise.all([
    getStudioConfig(),
    getWallet(),
    searchParams,
  ]);

  const config = configResult.ok ? configResult.data : null;

  return (
    <StudioWorkspace
      styles={config?.styles.length ? config.styles : defaultStyles}
      scenes={config?.scenes.length ? config.scenes : defaultScenes}
      aspectRatios={config?.aspectRatios.length ? config.aspectRatios : defaultAspectRatios}
      qualities={config?.qualities.length ? config.qualities : defaultQualities}
      configSource={config ? "service" : "default"}
      wallet={wallet}
      initialStyleId={params.style}
    />
  );
}

function StudioSkeleton() {
  return (
    <div className="grid gap-3 lg:grid-cols-[21rem_minmax(0,1fr)] xl:grid-cols-[23rem_minmax(0,1fr)]">
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-[14px] border border-line bg-white p-4 shadow-card">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-3 h-24 w-full" />
          </div>
        ))}
      </div>
      <div className="rounded-[var(--radius-card)] border border-line bg-white p-4 shadow-card">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-4 aspect-[4/5] w-full rounded-[12px]" />
      </div>
    </div>
  );
}
