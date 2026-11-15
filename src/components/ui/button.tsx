import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "font-semibold tracking-[-0.01em] cursor-pointer select-none",
    "transition-[background-color,color,border-color,box-shadow,transform] duration-150 ease-out",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet",
    "disabled:pointer-events-none disabled:opacity-55",
    "[&_svg]:size-[1.05em] [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        primary:
          "bg-violet text-white shadow-[0_1px_2px_rgb(21_21_44_/_0.10),0_10px_22px_-14px_rgb(96_69_245_/_0.75)] hover:bg-violet-hover active:translate-y-px",
        secondary:
          "bg-white text-ink border border-line-strong shadow-[0_1px_2px_rgb(21_21_44_/_0.04)] hover:border-ink/25 hover:bg-white active:translate-y-px",
        tint: "bg-tint text-violet-ink border border-transparent hover:bg-tint-deep",
        inverse:
          "bg-white text-violet-ink shadow-[0_10px_24px_-16px_rgb(10_6_40_/_0.6)] hover:bg-white/92",
        inverseOutline:
          "border border-white/45 text-white hover:border-white hover:bg-white/10",
        ghost: "text-ink hover:bg-ink/[0.04]",
        link: "text-violet-ink underline decoration-violet/35 underline-offset-4 hover:decoration-violet",
      },
      size: {
        sm: "h-9 rounded-[8px] px-3.5 text-[0.8125rem]",
        md: "h-11 rounded-[10px] px-4.5 text-[0.9375rem]",
        lg: "h-12 rounded-[11px] px-6 text-[0.9375rem]",
        xl: "h-[54px] rounded-[11px] px-7 text-base",
        none: "p-0 h-auto rounded-none",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type ButtonVariantProps = VariantProps<typeof buttonVariants>;

export interface ButtonProps
  extends React.ComponentProps<"button">,
    ButtonVariantProps {
  asChild?: boolean;
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
