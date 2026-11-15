import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const cardVariants = cva("relative rounded-[var(--radius-card)]", {
  variants: {
    variant: {
      default: "bg-white border border-line shadow-card",
      flat: "bg-white border border-line",
      tint: "bg-tint border border-violet/12",
      ghost: "bg-surface border border-transparent",
      inverse: "bg-white/8 border border-white/15 text-white backdrop-blur-sm",
      highlighted:
        "bg-white border border-violet/30 shadow-[0_2px_4px_rgb(21_21_44_/_0.04),0_30px_60px_-40px_rgb(72_45_200_/_0.45)] ring-1 ring-violet/10",
    },
    padding: {
      none: "",
      sm: "p-4",
      md: "p-6",
      lg: "p-7 sm:p-8",
    },
  },
  defaultVariants: { variant: "default", padding: "none" },
});

export interface CardProps
  extends React.ComponentProps<"div">,
    VariantProps<typeof cardVariants> {}

export function Card({ className, variant, padding, ...props }: CardProps) {
  return (
    <div
      data-slot="card"
      className={cn(cardVariants({ variant, padding }), className)}
      {...props}
    />
  );
}

export type { VariantProps };
export { cardVariants };
