import * as React from "react";

import { cn } from "@/lib/utils";

/** Small uppercase label used above headings. Optional editorial index numeral. */
export function Eyebrow({
  children,
  index,
  className,
  tone = "violet",
  as: Comp = "p",
}: {
  children: React.ReactNode;
  index?: string;
  className?: string;
  tone?: "violet" | "muted" | "inverse";
  as?: React.ElementType;
}) {
  return (
    <Comp
      className={cn(
        "text-eyebrow flex items-center gap-2.5",
        tone === "violet" && "text-violet-ink",
        tone === "muted" && "text-muted",
        tone === "inverse" && "text-white/90",
        className,
      )}
    >
      {index ? (
        <span
          aria-hidden="true"
          className={cn(
            "font-mono text-[0.625rem] tabular-nums tracking-[0.12em]",
            tone === "inverse" ? "text-white/45" : "text-muted/70",
          )}
        >
          {index}
        </span>
      ) : null}
      {index ? (
        <span
          aria-hidden="true"
          className={cn(
            "h-px w-5",
            tone === "inverse" ? "bg-white/25" : "bg-line-strong",
          )}
        />
      ) : null}
      <span>{children}</span>
    </Comp>
  );
}
