import * as React from "react";

import { cn } from "@/lib/utils";

/** Page-width container. 1320px max with a comfortable mobile gutter. */
export function Container({
  className,
  children,
  as: Comp = "div",
  ...props
}: React.ComponentProps<"div"> & { as?: React.ElementType }) {
  return (
    <Comp
      className={cn("mx-auto w-full max-w-[var(--container-page)] px-5 sm:px-8", className)}
      {...props}
    >
      {children}
    </Comp>
  );
}
