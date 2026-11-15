import { Eyebrow } from "@/components/shared/eyebrow";
import type { TocEntry } from "@/lib/blog";
import { cn } from "@/lib/utils";

function TocList({ entries }: { entries: readonly TocEntry[] }) {
  return (
    <ol className="mt-4 space-y-2.5 border-l border-line pl-4">
      {entries.map((entry) => (
        <li key={entry.id} className={cn(entry.level === 3 && "pl-3")}>
          <a
            href={`#${entry.id}`}
            className="block rounded text-[0.875rem] leading-snug text-muted-strong transition-colors hover:text-violet-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet"
          >
            {entry.text}
          </a>
        </li>
      ))}
    </ol>
  );
}

/**
 * Article contents. Static anchors on every breakpoint — the links work with
 * JavaScript disabled and are keyboard reachable in document order. On small screens
 * the same list is folded into a native `<details>`, which needs no script.
 */
export function TableOfContents({
  entries,
  className,
}: {
  entries: readonly TocEntry[];
  className?: string;
}) {
  if (entries.length === 0) return null;

  return (
    <>
      <details className={cn("group rounded-xl border border-line bg-surface px-5 py-4 lg:hidden", className)}>
        <summary className="cursor-pointer list-none rounded text-[0.8125rem] font-semibold text-ink marker:content-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet">
          <span className="inline-flex items-center gap-2">
            <span className="text-eyebrow text-muted">On this page</span>
            <span aria-hidden="true" className="text-muted group-open:hidden">＋</span>
            <span aria-hidden="true" className="hidden text-muted group-open:inline">−</span>
          </span>
        </summary>
        <nav aria-label="Article contents">
          <TocList entries={entries} />
        </nav>
      </details>

      <nav aria-label="Article contents" className={cn("hidden lg:block", className)}>
        <Eyebrow tone="muted">On this page</Eyebrow>
        <TocList entries={entries} />
      </nav>
    </>
  );
}
