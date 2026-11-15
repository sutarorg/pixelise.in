import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { ArticleBody } from "@/components/blog/article-body";
import { PostLink } from "@/components/blog/post-card";
import { TableOfContents } from "@/components/blog/table-of-contents";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Eyebrow } from "@/components/shared/eyebrow";
import { JsonLd } from "@/components/shared/json-ld";
import { Button } from "@/components/ui/button";
import { blogAuthor, blogConfig, getBlogCategory } from "@/config/blog";
import { routes } from "@/config/site";
import {
  countWords,
  extractToc,
  formatPostDate,
  getAllPosts,
  getCategoryHref,
  getPostBody,
  getPostHref,
  getRelatedPosts,
  postReadingMinutes,
  requirePost,
  type BlogPostMeta,
} from "@/lib/blog";
import { pageMetadata } from "@/lib/seo/metadata";
import { blogPostingSchema, breadcrumbSchema } from "@/lib/seo/structured-data";

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getAllPosts().find((candidate) => candidate.slug === slug);

  if (!post) {
    return { title: "Article not found", robots: { index: false, follow: false } };
  }

  return pageMetadata({
    title: post.title,
    description: post.description,
    path: getPostHref(post.slug),
    keywords: post.keywords,
    type: "article",
    image: {
      path: post.cover.src,
      width: post.cover.width,
      height: post.cover.height,
      alt: post.cover.alt,
    },
    publishedTime: `${post.publishedAt}T00:00:00.000Z`,
    modifiedTime: `${post.updatedAt}T00:00:00.000Z`,
  });
}

function ArticleMeta({ post, minutes }: { post: BlogPostMeta; minutes: number }) {
  const category = getBlogCategory(post.category);

  return (
    <div className="mt-7 flex flex-wrap items-center gap-x-3 gap-y-2 text-[0.8125rem] text-muted">
      <Link
        href={getCategoryHref(category.slug)}
        className="rounded-full border border-line-strong px-3 py-1 text-[0.75rem] font-semibold text-violet-ink transition-colors hover:border-violet/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet"
      >
        {category.label}
      </Link>
      <span>By {blogAuthor.name}</span>
      <span aria-hidden="true">·</span>
      <span>
        Published{" "}
        <time dateTime={post.publishedAt}>{formatPostDate(post.publishedAt)}</time>
      </span>
      {post.updatedAt !== post.publishedAt ? (
        <>
          <span aria-hidden="true">·</span>
          <span>
            Updated <time dateTime={post.updatedAt}>{formatPostDate(post.updatedAt)}</time>
          </span>
        </>
      ) : null}
      <span aria-hidden="true">·</span>
      <span>{minutes} min read</span>
    </div>
  );
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  if (!getAllPosts().some((post) => post.slug === slug)) notFound();

  const post = requirePost(slug);
  const body = getPostBody(slug);
  const toc = extractToc(body);
  const minutes = postReadingMinutes(slug);
  const category = getBlogCategory(post.category);
  const related = getRelatedPosts(post);

  const crumbs = [
    { label: "Home", href: routes.home },
    { label: "Journal", href: blogConfig.path },
    { label: category.label, href: getCategoryHref(category.slug) },
    { label: post.title },
  ];

  return (
    <>
      <article>
        <header className="relative overflow-hidden border-b border-line">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(70%_100%_at_25%_0%,#F6F3FF_0%,#FCFBFF_55%,#FFFFFF_100%)]"
          />
          <Container className="relative pb-10 pt-6 sm:pb-14">
            <Breadcrumbs items={crumbs} />
            <div className="mt-8 max-w-[52rem]">
              <Eyebrow>{category.label}</Eyebrow>
              <h1 className="text-display-sm mt-5 text-ink">{post.title}</h1>
              <p className="text-lead mt-5 max-w-[44rem] text-muted-strong">{post.description}</p>
              <ArticleMeta post={post} minutes={minutes} />
            </div>
          </Container>
        </header>

        <Container className="pt-8 sm:pt-10">
          <figure>
            <div className="overflow-hidden rounded-[var(--radius-panel)] border border-line bg-tint">
              <Image
                src={post.cover.src}
                alt={post.cover.alt}
                width={post.cover.width}
                height={post.cover.height}
                sizes="(min-width: 1280px) 78rem, 100vw"
                priority
                quality={82}
                className="h-auto w-full"
              />
            </div>
            <figcaption className="mt-3 text-[0.75rem] leading-relaxed text-muted">
              {blogConfig.coverNote}
            </figcaption>
          </figure>
        </Container>

        <Section tone="canvas" space="md" className="pt-10 sm:pt-12">
          <div className="grid gap-10 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-16">
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <TableOfContents entries={toc} />
              <div className="mt-8 hidden rounded-xl border border-line bg-surface p-5 lg:block">
                <p className="text-eyebrow text-muted">Written by</p>
                <p className="mt-2 text-[0.9375rem] font-semibold text-ink">{blogAuthor.name}</p>
                <p className="mt-2 text-[0.8125rem] leading-relaxed text-muted">
                  Organisational byline. No individual credentials are claimed.
                </p>
                <Button asChild size="sm" className="mt-4 w-full">
                  <Link href={routes.pricing}>See packs</Link>
                </Button>
              </div>
            </aside>

            <div className="min-w-0 max-w-[44rem]">
              <ArticleBody markdown={body} />

              <div className="mt-14 rounded-[var(--radius-panel)] border border-line bg-surface p-6 sm:p-8">
                <h2 className="text-h3 text-ink">About the author</h2>
                <p className="mt-3 text-[0.9375rem] leading-[1.72] text-muted-strong">
                  {blogAuthor.description}
                </p>
                <p className="mt-3 text-[0.8125rem] leading-relaxed text-muted">
                  This article does not claim human expert review, third-party endorsement or a
                  guaranteed search result. Sources are listed in the article.
                </p>
              </div>

              <div className="mt-10 flex flex-wrap items-center gap-3">
                <Button asChild>
                  <Link href={routes.pricing}>See credit packs</Link>
                </Button>
                <Button asChild variant="secondary">
                  <Link href={getCategoryHref(category.slug)}>More {category.label.toLowerCase()}</Link>
                </Button>
              </div>
            </div>
          </div>
        </Section>

        <Section tone="surface" space="md" divider>
          <div className="grid gap-10 lg:grid-cols-[1fr_20rem] lg:gap-16">
            <div>
              <Eyebrow>Related reading</Eyebrow>
              <ul className="mt-5 max-w-[44rem]">
                {related.map((item) => (
                  <PostLink key={item.slug} post={item} readingMinutes={postReadingMinutes(item.slug)} />
                ))}
              </ul>
            </div>
            <aside className="rounded-[var(--radius-card)] border border-line bg-canvas p-6 shadow-card">
              <Eyebrow>Keep reading</Eyebrow>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted-strong">
                Browse every guide in the journal, or start with the category that matches what you
                are shooting.
              </p>
              <Button asChild variant="secondary" size="sm" className="mt-4 w-full">
                <Link href={blogConfig.path}>All articles</Link>
              </Button>
            </aside>
          </div>
        </Section>
      </article>

      <JsonLd
        data={[
          blogPostingSchema({
            slug: post.slug,
            title: post.title,
            description: post.description,
            publishedAt: post.publishedAt,
            updatedAt: post.updatedAt,
            categoryLabel: category.label,
            keywords: post.keywords,
            cover: post.cover,
            wordCount: countWords(body),
          }),
          breadcrumbSchema([
            { label: "Home", href: routes.home },
            { label: "Journal", href: blogConfig.path },
            { label: category.label, href: getCategoryHref(category.slug) },
            { label: post.title, href: getPostHref(post.slug) },
          ]),
        ]}
      />
    </>
  );
}
