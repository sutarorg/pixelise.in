import type { Metadata } from "next";
import Link from "next/link";

import { Section } from "@/components/layout/section";
import { PageHero } from "@/components/marketing/page-hero";
import { FinalCta } from "@/components/marketing/final-cta";
import { JsonLd } from "@/components/shared/json-ld";
import { SectionHeading } from "@/components/shared/section-heading";
import { CategoryLink, PostCard } from "@/components/blog/post-card";
import { blogConfig } from "@/config/blog";
import { routes } from "@/config/site";
import { getAllPosts, getCategorySummaries, postReadingMinutes } from "@/lib/blog";
import { pageMetadata } from "@/lib/seo/metadata";
import { blogSchema, breadcrumbSchema } from "@/lib/seo/structured-data";

export const metadata: Metadata = pageMetadata({
  title: "The Pixelise Journal — Product Photography Guides",
  description:
    "Practical product photography guides for ecommerce: platform image requirements, lighting and backgrounds, category-specific advice and where AI imagery actually helps.",
  path: blogConfig.path,
  keywords: [
    "product photography guides",
    "ecommerce photography",
    "AI product photography",
    "product photo tips",
  ],
});

export default function BlogIndexPage() {
  const posts = getAllPosts();
  const [featured, ...rest] = posts;
  const categories = getCategorySummaries();
  const crumbs = [
    { label: "Home", href: routes.home },
    { label: "Journal" },
  ];

  return (
    <>
      <PageHero
        eyebrow={blogConfig.eyebrow}
        title={blogConfig.headline}
        lead={blogConfig.description}
        crumbs={crumbs}
        meta={
          <nav aria-label="Journal categories">
            <ul className="flex flex-wrap gap-2">
              <li>
                <Link
                  href={blogConfig.path}
                  aria-current="page"
                  className="inline-flex items-center gap-2 rounded-full border border-violet bg-violet px-3.5 py-1.5 text-[0.8125rem] font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet"
                >
                  All Articles
                  <span className="text-[0.6875rem] tabular-nums text-white/70">{posts.length}</span>
                </Link>
              </li>
              {categories.map((category) => (
                <li key={category.slug}>
                  <CategoryLink
                    slug={category.slug}
                    label={category.label}
                    count={category.count}
                    active={false}
                  />
                </li>
              ))}
            </ul>
          </nav>
        }
      />

      <Section tone="canvas" space="lg">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading
            eyebrow="Latest"
            title="Start here"
            lead="Every guide is written for someone who has to ship a product page, not for a photography portfolio."
          />
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.35fr_1fr]">
          <PostCard
            post={featured}
            readingMinutes={postReadingMinutes(featured.slug)}
            featured
            priority
          />
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
            {rest.slice(0, 2).map((post) => (
              <li key={post.slug}>
                <PostCard post={post} readingMinutes={postReadingMinutes(post.slug)} className="h-full" />
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-16">
          <SectionHeading eyebrow="All articles" title={`${posts.length} guides`} as="h2" />
          <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rest.slice(2).map((post) => (
              <li key={post.slug}>
                <PostCard post={post} readingMinutes={postReadingMinutes(post.slug)} className="h-full" />
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-16 rounded-[var(--radius-panel)] border border-line bg-surface p-6 sm:p-8">
          <div>
            <h2 className="text-h3 text-ink">Who writes this journal</h2>
            <p className="mt-3 max-w-[46rem] text-[0.9375rem] leading-[1.72] text-muted-strong">
              Articles are written by the Pixelise Editorial Team and published
              under an organisational byline. We do not invent named experts, credentials
              or customer results. Where a claim depends on a platform&apos;s current rules, the
              article links to that platform&apos;s own documentation so you can verify it.
            </p>
            <p className="mt-3 max-w-[46rem] text-[0.875rem] leading-[1.7] text-muted">
              {blogConfig.coverNote} Articles are updated when the underlying guidance changes; the
              publication and modification dates are shown on each page.
            </p>
          </div>
        </div>
      </Section>

      <FinalCta />

      <JsonLd
        data={[
          blogSchema(getAllPosts()),
          breadcrumbSchema([
            { label: "Home", href: routes.home },
            { label: "Journal", href: blogConfig.path },
          ]),
        ]}
      />
    </>
  );
}
