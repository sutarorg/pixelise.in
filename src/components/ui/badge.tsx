import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full font-semibold whitespace-nowrap",
  {
    variants: {
      variant: {
        outline: "border border-line-strong bg-white text-muted-strong",
        tint: "bg-tint text-violet-ink",
        violet: "bg-violet text-white",
        inverse: "border border-white/25 bg-white/10 text-white",
        success: "bg-[color-mix(in_oklab,var(--color-success)_12%,white)] text-[#0d6b46]",
      },
      size: {
        sm: "px-2.5 py-1 text-[0.6875rem] tracking-[0.02em]",
        md: "px-3 py-1.5 text-[0.75rem]",
        eyebrow: "px-3 py-1.5 text-[0.6875rem] uppercase tracking-[0.14em]",
      },
    },
    defaultVariants: { variant: "outline", size: "sm" },
  },
);

export interface BadgeProps
  extends React.ComponentProps<"span">,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  );
}
