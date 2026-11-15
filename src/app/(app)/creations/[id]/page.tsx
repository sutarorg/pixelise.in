import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { Download, Images, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/app/page-header";
import { SectionCard } from "@/components/app/section-card";
import { EmptyState, ErrorState } from "@/components/app/state-views";
import { DeleteCreationButton } from "@/components/creations/delete-creation-button";
import { getGeneration } from "@/lib/api/server";
import { formatCredits, formatDateTime } from "@/lib/format";

export const metadata: Metadata = {
  title: "Creation",
  description: "The full visual, its source photo and generation details.",
};

export default function CreationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div className="space-y-4">
      <Suspense fallback={<DetailSkeleton />}>
        <CreationDetail params={params} />
      </Suspense>
    </div>
  );
}

async function CreationDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getGeneration(id);

  if (!result.ok) {
    /*
     * A creation that does not exist, was deleted, or belongs to another
     * account all resolve to the same safe surface: no metadata, no image, no
     * hint about whether the id exists. The service decides which one it is.
     */
    const missing = result.error.code === "not_found" || result.error.code === "forbidden";

    return (
      <div className="space-y-4">
        <PageHeader
          title="Creation"
          description="A single visual with its source photo and generation details."
          back={{ href: "/creations", label: "My creations" }}
        />
        <div className="rounded-[var(--radius-card)] border border-line bg-white shadow-card">
        {missing ? (
          <EmptyState
            icon={Images}
            tone="neutral"
            title="This visual isn't available"
            description="It may have been deleted, or it belongs to a different account. Nothing here is cached or guessable."
            action={
              <Button asChild size="sm" variant="secondary">
                <Link href="/creations">Back to my creations</Link>
              </Button>
            }
          />
        ) : (
          <ErrorState
            error={result.error}
            title="We couldn't load this visual"
            description={
              result.error.code === "not_configured"
                ? "Creation details appear here once this workspace is connected to the Pixelise service."
                : undefined
            }
            action={
              <Button asChild size="sm" variant="secondary">
                <Link href="/creations">Back to my creations</Link>
              </Button>
            }
          />
        )}
        </div>
      </div>
    );
  }

  const generation = result.data;
  const label = `${generation.styleName} visual${generation.sceneName ? ` — ${generation.sceneName}` : ""}`;
  const done = generation.status === "completed" && generation.resultUrl;

  return (
    <>
      <PageHeader
        title={generation.sceneName ?? generation.styleName}
        description={`${generation.styleName} · ${generation.aspectRatio} · ${formatDateTime(
          generation.createdAt,
        )}`}
        back={{ href: "/creations", label: "My creations" }}
        actions={
          done ? (
            <>
              <Button asChild size="sm" variant="secondary">
                <a
                  href={generation.resultUrl ?? "#"}
                  download={`pixelise-${generation.id}.jpg`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download className="size-4" aria-hidden="true" />
                  Download
                </a>
              </Button>
              <DeleteCreationButton id={generation.id} label={label} variant="button" />
            </>
          ) : (
            <DeleteCreationButton id={generation.id} label={label} variant="button" />
          )
        }
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="min-w-0 overflow-hidden rounded-[var(--radius-card)] border border-line bg-white shadow-card">
          <div className="bg-[#f7f6fb] p-2.5 sm:p-4">
            {done ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={generation.resultUrl ?? ""}
                alt={`${generation.styleName} visual of your product`}
                className="mx-auto max-h-[70vh] w-full rounded-[10px] object-contain"
              />
            ) : (
              <EmptyState
                icon={Sparkles}
                tone="neutral"
                title={
                  generation.status === "failed"
                    ? "This render didn't finish"
                    : "This visual is still rendering"
                }
                description={
                  generation.failureReason ??
                  "As soon as the studio finishes, the image and its download appear here."
                }
                action={
                  <Button asChild size="sm" variant="secondary">
                    <Link href="/studio">Create another visual</Link>
                  </Button>
                }
              />
            )}
          </div>
        </div>

        <div className="space-y-3">
          <SectionCard title="Details" headingId="detail-heading">
            <dl className="divide-y divide-line px-4 sm:px-5">
              {[
                { label: "Style", value: generation.styleName },
                { label: "Scene", value: generation.sceneName ?? "—" },
                { label: "Quality", value: generation.qualityLabel },
                {
                  label: "Resolution",
                  value:
                    generation.width && generation.height
                      ? `${generation.width}×${generation.height}px`
                      : "Reported when the render completes",
                },
                { label: "Aspect ratio", value: generation.aspectRatio },
                { label: "Created", value: formatDateTime(generation.createdAt) },
                {
                  label: "Credits used",
                  value:
                    generation.creditsCharged !== null
                      ? `${formatCredits(generation.creditsCharged)} credits`
                      : generation.creditsReserved !== null
                        ? `${formatCredits(generation.creditsReserved)} reserved`
                        : "Not settled yet",
                },
              ].map((row) => (
                <div key={row.label} className="flex items-start justify-between gap-4 py-2.5">
                  <dt className="text-[0.75rem] text-muted">{row.label}</dt>
                  <dd className="max-w-[60%] text-right text-[0.8125rem] font-semibold text-ink">
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          </SectionCard>

          {generation.sourceUrl ? (
            <SectionCard title="Source photo" headingId="source-heading">
              <div className="p-3">
                <div className="overflow-hidden rounded-[10px] border border-line bg-surface">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={generation.sourceUrl}
                    alt="The product photo this visual was generated from"
                    className="mx-auto max-h-[18rem] w-full object-contain"
                  />
                </div>
                <p className="mt-2 text-[0.6875rem] leading-[1.5] text-muted">
                  Your upload is kept with the visual so you can generate another scene from the
                  same photo.
                </p>
                <Button asChild size="sm" variant="secondary" className="mt-2.5">
                  <Link href="/studio">Reuse this photo</Link>
                </Button>
              </div>
            </SectionCard>
          ) : null}
        </div>
      </div>
    </>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-56" />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_21rem]">
        <Skeleton className="aspect-[4/5] w-full rounded-[var(--radius-card)]" />
        <Skeleton className="h-72 w-full rounded-[var(--radius-card)]" />
      </div>
    </div>
  );
}
