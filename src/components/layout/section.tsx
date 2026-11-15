import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { Container } from "@/components/layout/container";

const sectionVariants = cva("relative", {
  variants: {
    tone: {
      canvas: "bg-canvas",
      surface: "bg-surface",
      tint: "bg-tint",
      ink: "bg-footer text-white",
      plain: "",
    },
    space: {
      sm: "py-12 sm:py-14",
      md: "py-16 sm:py-20 lg:py-24",
      lg: "py-20 sm:py-24 lg:py-32",
      none: "",
    },
    divider: {
      true: "border-t border-line",
      false: "",
    },
  },
  defaultVariants: { tone: "canvas", space: "md", divider: false },
});

export interface SectionProps
  extends React.ComponentProps<"section">,
    VariantProps<typeof sectionVariants> {
  container?: boolean;
  containerClassName?: string;
}

export function Section({
  className,
  tone,
  space,
  divider,
  container = true,
  containerClassName,
  children,
  ...props
}: SectionProps) {
  return (
    <section className={cn(sectionVariants({ tone, space, divider }), className)} {...props}>
      {container ? (
        <Container className={containerClassName}>{children}</Container>
      ) : (
        children
      )}
    </section>
  );
}
