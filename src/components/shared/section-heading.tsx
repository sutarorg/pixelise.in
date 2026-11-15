import * as React from "react";

import { cn } from "@/lib/utils";
import { Eyebrow } from "@/components/shared/eyebrow";

export function SectionHeading({
  eyebrow,
  index,
  title,
  lead,
  align = "left",
  tone = "default",
  className,
  titleClassName,
  leadClassName,
  action,
  layout = "stacked",
  as: Heading = "h2",
  id,
}: {
  eyebrow?: string;
  index?: string;
  title: React.ReactNode;
  lead?: React.ReactNode;
  align?: "left" | "center";
  tone?: "default" | "inverse";
  className?: string;
  titleClassName?: string;
  leadClassName?: string;
  action?: React.ReactNode;
  /** "split" places the lead beside the title on large screens. */
  layout?: "stacked" | "split";
  as?: "h1" | "h2" | "h3";
  id?: string;
}) {
  if (layout === "split") {
    return (
      <div className={cn("grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end lg:gap-16", className)}>
        <div>
          {eyebrow ? (
            <Eyebrow index={index} tone={tone === "inverse" ? "inverse" : "violet"}>
              {eyebrow}
            </Eyebrow>
          ) : null}
          <Heading
            id={id}
            className={cn(
              "text-h2 mt-4",
              tone === "inverse" ? "text-white" : "text-ink",
              titleClassName,
            )}
          >
            {title}
          </Heading>
        </div>
        {lead ? (
          <p
            className={cn(
              "text-body max-w-[32rem] lg:pb-1.5",
              tone === "inverse" ? "text-white/85" : "text-muted-strong",
              leadClassName,
            )}
          >
            {lead}
          </p>
        ) : null}
        {action ? <div className="lg:col-span-2">{action}</div> : null}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-6",
        align === "center" && "items-center text-center",
        action && "lg:flex-row lg:items-end lg:justify-between lg:gap-12",
        className,
      )}
    >
      <div className={cn("flex max-w-[46rem] flex-col gap-4", align === "center" && "items-center")}>
        {eyebrow ? (
          <Eyebrow index={index} tone={tone === "inverse" ? "inverse" : "violet"}>
            {eyebrow}
          </Eyebrow>
        ) : null}
        <Heading
          id={id}
          className={cn(
            "text-h2",
            tone === "inverse" ? "text-white" : "text-ink",
            titleClassName,
          )}
        >
          {title}
        </Heading>
        {lead ? (
          <p
            className={cn(
              "text-lead",
              tone === "inverse" ? "text-white/70" : "text-muted-strong",
              align === "center" && "max-w-[38rem]",
              leadClassName,
            )}
          >
            {lead}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
