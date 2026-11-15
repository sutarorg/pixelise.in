import ReactMarkdown from "react-markdown";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";

/**
 * Renders article Markdown on the server.
 *
 * Styling is explicit rather than a typography plugin: the journal needs the same
 * type scale as the marketing pages (Manrope, violet links, tinted callouts), and
 * the renderer is the only place that has to know about it.
 *
 * `rehypeSlug` generates heading IDs with github-slugger, which is the same
 * implementation the table of contents uses — anchors always match.
 */
export function ArticleBody({ markdown, className }: { markdown: string; className?: string }) {
  return (
    <div className={cn("text-[1.0625rem] leading-[1.78] text-ink-soft", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSlug]}
        components={{
          h2: ({ children, id }) => (
            <h2
              id={id}
              className="mt-14 scroll-mt-28 text-h2 text-ink first:mt-0 sm:mt-16"
            >
              {children}
            </h2>
          ),
          h3: ({ children, id }) => (
            <h3 id={id} className="mt-9 scroll-mt-28 text-h3 text-ink">
              {children}
            </h3>
          ),
          p: ({ children }) => <p className="mt-5">{children}</p>,
          a: ({ children, href }) => {
            const external = Boolean(href && /^https?:\/\//.test(href));
            return (
              <a
                href={href}
                {...(external ? { target: "_blank", rel: "noreferrer noopener" } : {})}
                className="rounded font-medium text-violet-ink underline decoration-violet/30 decoration-1 underline-offset-[3px] transition-colors hover:decoration-violet focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet"
              >
                {children}
              </a>
            );
          },
          strong: ({ children }) => <strong className="font-semibold text-ink">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          ul: ({ children }) => (
            <ul className="mt-5 list-disc space-y-2.5 pl-6 marker:text-violet/50">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mt-5 list-decimal space-y-2.5 pl-6 marker:font-semibold marker:text-violet-ink">
              {children}
            </ol>
          ),
          li: ({ children, ...props }) => {
            const className = (props as { className?: string }).className;
            const isTask = Boolean(className?.includes("task-list-item"));
            return (
              <li className={cn("[&>p]:mt-0", isTask && "list-none")}>{children}</li>
            );
          },
          blockquote: ({ children }) => (
            <blockquote className="mt-7 rounded-r-xl border-l-[3px] border-violet/60 bg-tint/70 px-5 py-4 text-[1rem] text-ink-soft">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="mt-12 border-0 border-t border-line" />,
          code: ({ children }) => (
            <code className="rounded bg-tint px-1.5 py-0.5 font-mono text-[0.875em] text-ink">
              {children}
            </code>
          ),
          table: ({ children }) => (
            <div className="mt-7 overflow-x-auto rounded-xl border border-line shadow-card">
              <table className="w-full min-w-[34rem] border-collapse text-left text-[0.9375rem]">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-tint/80">{children}</thead>,
          tr: ({ children }) => (
            <tr className="border-b border-line last:border-0 even:bg-surface/60">{children}</tr>
          ),
          th: ({ children }) => (
            <th
              scope="col"
              className="px-4 py-3 text-[0.75rem] font-bold uppercase tracking-[0.1em] text-ink"
            >
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-3 align-top text-muted-strong">{children}</td>
          ),
          input: (props) => (
            <input
              {...props}
              disabled
              aria-hidden="true"
              tabIndex={-1}
              className="mr-2 size-3.5 accent-violet"
            />
          ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
