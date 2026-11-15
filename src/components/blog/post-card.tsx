import Image from "next/image";
import Link from "next/link";

import { getBlogCategory, type BlogCategorySlug } from "@/config/blog";
import { formatPostDate, getCategoryHref, getPostHref, type BlogPostMeta } from "@/lib/blog";
import { cn } from "@/lib/utils";

/**
 * Article card used on the journal index and category pages.
 *
 * The whole card is a single link (via the stretched-link pattern on the title) so
 * keyboard users get one tab stop, and the category is repeated as plain text rather
 * than a second nested interactive element.
 */
export function PostCard({
  post,
  readingMinutes,
  featured = false,
  priority = false,
  className,
}: {
  post: BlogPostMeta;
  readingMinutes: number;
  featured?: boolean;
  priority?: boolean;
  className?: string;
}) {
  const category = getBlogCategory(post.category);
  const href = getPostHref(post.slug);

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-canvas shadow-card transition-shadow hover:shadow-lift",
        className,
      )}
    >
      <div className={cn("relative overflow-hidden bg-tint", featured ? "aspect-[16/8]" : "aspect-[16/9]")}>
        <Image
          src={post.cover.src}
          alt={post.cover.alt}
          width={post.cover.width}
          height={post.cover.height}
          sizes={featured ? "(min-width: 1024px) 52rem, 100vw" : "(min-width: 1024px) 24rem, (min-width: 640px) 50vw, 100vw"}
          priority={priority}
          quality={80}
          className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.02] motion-reduce:transition-none"
        />
      </div>

      <div className={cn("flex flex-1 flex-col p-6", featured && "sm:p-8")}>
        <p className="text-eyebrow text-violet-ink">{category.label}</p>
        <h3 className={cn("mt-3 text-h3 text-ink", featured && "text-h2")}>
          <Link
            href={href}
            className="rounded after:absolute after:inset-0 after:content-[''] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet"
          >
            {post.title}
          </Link>
        </h3>
        <p className="mt-3 flex-1 text-[0.9375rem] leading-[1.68] text-muted-strong">
          {post.excerpt}
        </p>
        <p className="mt-6 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[0.75rem] text-muted">
          <time dateTime={post.publishedAt}>{formatPostDate(post.publishedAt)}</time>
          <span aria-hidden="true">·</span>
          <span>{readingMinutes} min read</span>
        </p>
      </div>
    </article>
  );
}

/** Compact text-only list item used in "related articles" and category listings. */
export function PostLink({ post, readingMinutes }: { post: BlogPostMeta; readingMinutes: number }) {
  const category = getBlogCategory(post.category);

  return (
    <li className="border-t border-line py-5 first:border-t-0 first:pt-0">
      <p className="text-eyebrow text-muted">{category.label}</p>
      <p className="mt-2 text-[1.0625rem] font-semibold leading-snug text-ink">
        <Link
          href={getPostHref(post.slug)}
          className="rounded transition-colors hover:text-violet-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet"
        >
          {post.title}
        </Link>
      </p>
      <p className="mt-2 text-[0.75rem] text-muted">
        <time dateTime={post.publishedAt}>{formatPostDate(post.publishedAt)}</time>
        <span aria-hidden="true"> · </span>
        {readingMinutes} min read
      </p>
    </li>
  );
}

export function CategoryLink({
  slug,
  label,
  count,
  active,
}: {
  slug: BlogCategorySlug;
  label: string;
  count?: number;
  active: boolean;
}) {
  return (
    <Link
      href={getCategoryHref(slug)}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[0.8125rem] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet",
        active
          ? "border-violet bg-violet text-white"
          : "border-line-strong bg-canvas text-muted-strong hover:border-violet/40 hover:text-ink",
      )}
    >
      {label}
      {typeof count === "number" ? (
        <span className={cn("text-[0.6875rem] tabular-nums", active ? "text-white/70" : "text-muted")}>
          {count}
        </span>
      ) : null}
    </Link>
  );
}
