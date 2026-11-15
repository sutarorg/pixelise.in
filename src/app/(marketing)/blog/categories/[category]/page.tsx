import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Section } from "@/components/layout/section";
import { PageHero } from "@/components/marketing/page-hero";
import { FinalCta } from "@/components/marketing/final-cta";
import { CategoryLink, PostCard } from "@/components/blog/post-card";
import { JsonLd } from "@/components/shared/json-ld";
import { SectionHeading } from "@/components/shared/section-heading";
import { blogCategories, blogConfig, getBlogCategory, isBlogCategory } from "@/config/blog";
import { routes } from "@/config/site";
import {
  getCategoryHref,
  getCategorySummaries,
  getPostsByCategory,
  postReadingMinutes,
} from "@/lib/blog";
import { pageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema } from "@/lib/seo/structured-data";

type PageProps = { params: Promise<{ category: string }> };

export function generateStaticParams() {
  return blogCategories.map((category) => ({ category: category.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category: slug } = await params;
  if (!isBlogCategory(slug)) {
    return { title: "Category not found", robots: { index: false, follow: false } };
  }

  const category = getBlogCategory(slug);

  return pageMetadata({
    title: `${category.title} Articles`,
    description: category.description,
    path: getCategoryHref(slug),
    keywords: [`${category.label.toLowerCase()} articles`, "Pixelise journal"],
  });
}

export default async function BlogCategoryPage({ params }: PageProps) {
  const { category: slug } = await params;
  if (!isBlogCategory(slug)) notFound();

  const category = getBlogCategory(slug);
  const posts = getPostsByCategory(slug);
  const summaries = getCategorySummaries();

  const crumbs = [
    { label: "Home", href: routes.home },
    { label: "Journal", href: blogConfig.path },
    { label: category.label },
  ];

  return (
    <>
      <PageHero
        eyebrow="Journal category"
        title={category.title}
        lead={category.description}
        crumbs={crumbs}
        meta={
          <nav aria-label="Journal categories">
            <ul className="flex flex-wrap gap-2">
              <li>
                <Link
                  href={blogConfig.path}
                  className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-canvas px-3.5 py-1.5 text-[0.8125rem] font-medium text-muted-strong transition-colors hover:border-violet/40 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet"
                >
                  All Articles
                </Link>
              </li>
              {summaries.map((summary) => (
                <li key={summary.slug}>
                  <CategoryLink
                    slug={summary.slug}
                    label={summary.label}
                    count={summary.count}
                    active={summary.slug === slug}
                  />
                </li>
              ))}
            </ul>
          </nav>
        }
      />

      <Section tone="canvas" space="lg">
        <SectionHeading
          eyebrow="Articles"
          title={posts.length === 1 ? "One guide in this category" : `${posts.length} guides in this category`}
          lead="Each guide is written for a specific product category or platform, and links to the sources it relies on."
        />
        <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <li key={post.slug}>
              <PostCard post={post} readingMinutes={postReadingMinutes(post.slug)} className="h-full" />
            </li>
          ))}
        </ul>
      </Section>

      <FinalCta />

      <JsonLd
        data={[
          breadcrumbSchema([
            { label: "Home", href: routes.home },
            { label: "Journal", href: blogConfig.path },
            { label: category.label, href: getCategoryHref(slug) },
          ]),
        ]}
      />
    </>
  );
}
