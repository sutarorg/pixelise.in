import * as React from "react";

import { cn } from "@/lib/utils";

const fieldBase = [
  "w-full rounded-[10px] border border-line-strong bg-white text-ink",
  "px-3.5 py-3 text-[0.9375rem] leading-6",
  "placeholder:text-muted/80",
  "transition-[border-color,box-shadow] duration-150",
  "hover:border-ink/25",
  "focus:border-violet focus:shadow-[0_0_0_3px_rgb(96_69_245_/_0.14)] focus-visible:outline-none",
  "disabled:cursor-not-allowed disabled:bg-surface disabled:text-muted-strong",
  "aria-[invalid=true]:border-[#c4342a]",
].join(" ");

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return <input data-slot="input" className={cn(fieldBase, "h-12", className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(fieldBase, "min-h-[9.5rem] resize-y", className)}
      {...props}
    />
  );
}

export function Select({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      data-slot="select"
      className={cn(fieldBase, "h-12 cursor-pointer appearance-none pr-10", className)}
      {...props}
    />
  );
}

export function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn(
        "block text-[0.8125rem] font-semibold tracking-[-0.005em] text-ink",
        className,
      )}
      {...props}
    />
  );
}

export function FieldHint({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      className={cn("text-[0.75rem] leading-[1.5] text-muted", className)}
      {...props}
    />
  );
}

/** Inline field error. Uses the same red as the invalid input border. */
export function FieldError({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      role="alert"
      className={cn("text-[0.75rem] leading-[1.5] text-[#c4342a]", className)}
      {...props}
    />
  );
}
