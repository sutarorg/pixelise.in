import "server-only";

import fs from "node:fs";
import path from "node:path";

import GithubSlugger from "github-slugger";

import { blogConfig, blogCategories, getBlogCategory, type BlogCategorySlug } from "@/config/blog";
import { blogPosts, type BlogPostMeta } from "@/content/blog/posts";

const contentDir = path.join(process.cwd(), "src", "content", "blog");

export type { BlogPostMeta };

export type TocEntry = {
  id: string;
  text: string;
  level: 2 | 3;
};

/** Newest first; ties fall back to title so build output is deterministic. */
export function getAllPosts(): BlogPostMeta[] {
  return [...blogPosts].sort((a, b) => {
    if (a.publishedAt === b.publishedAt) return a.title.localeCompare(b.title);
    return a.publishedAt < b.publishedAt ? 1 : -1;
  });
}

export function getPost(slug: string): BlogPostMeta | undefined {
  return blogPosts.find((post) => post.slug === slug);
}

/** Throws for unknown slugs so a bad internal link fails the build, not the reader. */
export function requirePost(slug: string): BlogPostMeta {
  const post = getPost(slug);
  if (!post) throw new Error(`Unknown blog slug: ${slug}`);
  return post;
}

export function getPostsByCategory(category: BlogCategorySlug): BlogPostMeta[] {
  return getAllPosts().filter((post) => post.category === category);
}

export function getCategorySummaries() {
  return blogCategories.map((category) => ({
    ...category,
    count: getPostsByCategory(category.slug).length,
  }));
}

export function getRelatedPosts(post: BlogPostMeta, limit = 3): BlogPostMeta[] {
  const explicit = post.related.map(requirePost);
  if (explicit.length >= limit) return explicit.slice(0, limit);

  const fillers = getAllPosts().filter(
    (candidate) => candidate.slug !== post.slug && !post.related.includes(candidate.slug),
  );
  return [...explicit, ...fillers].slice(0, limit);
}

export function getPostHref(slug: string): string {
  return `${blogConfig.path}/${slug}`;
}

export function getCategoryHref(category: BlogCategorySlug): string {
  return `${blogConfig.path}/categories/${category}`;
}

/** Raw Markdown for an article. Read at build time from the content directory. */
export function getPostBody(slug: string): string {
  const file = path.join(contentDir, `${slug}.md`);
  if (!fs.existsSync(file)) {
    throw new Error(`Missing article body: src/content/blog/${slug}.md`);
  }
  return fs.readFileSync(file, "utf8").trim();
}

function stripInlineMarkdown(text: string): string {
  return text
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .trim();
}

/**
 * Extracts the table of contents in document order.
 *
 * IDs come from `github-slugger`, the same implementation `rehype-slug` uses when
 * rendering, so the anchors in the TOC always match the rendered headings.
 */
export function extractToc(markdown: string): TocEntry[] {
  const slugger = new GithubSlugger();
  const entries: TocEntry[] = [];
  let inFence = false;

  for (const line of markdown.split("\n")) {
    if (line.trimStart().startsWith("```")) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const match = /^(#{2,3})\s+(.*)$/.exec(line.trim());
    if (!match) continue;

    const level = match[1].length === 2 ? 2 : 3;
    const text = stripInlineMarkdown(match[2]);
    if (!text) continue;

    entries.push({ id: slugger.slug(text), text, level });
  }

  return entries;
}

export function countWords(markdown: string): number {
  const plain = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/^\s*\|.*\|\s*$/gm, " ")
    .replace(/[#>*_`~-]/g, " ");
  return plain.split(/\s+/).filter(Boolean).length;
}

/** Reading time, rounded up, minimum one minute. */
export function readingMinutes(markdown: string): number {
  return Math.max(1, Math.ceil(countWords(markdown) / blogConfig.wordsPerMinute));
}

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/** Formats an ISO date deterministically (UTC), e.g. "15 November 2026". */
export function formatPostDate(isoDate: string): string {
  return dateFormatter.format(new Date(`${isoDate}T00:00:00.000Z`));
}

export function getCategoryLabel(category: BlogCategorySlug): string {
  return getBlogCategory(category).label;
}

/** Reading time for a published article, computed from its body at build time. */
export function postReadingMinutes(slug: string): number {
  return readingMinutes(getPostBody(slug));
}
