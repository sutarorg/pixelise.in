"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * A real `role="switch"` control.
 *
 * It never flips optimistically: the parent owns the value and only updates it
 * after the service confirms. While the change is in flight the switch reports
 * `aria-busy` and cannot be toggled twice.
 */
export function Switch({
  checked,
  onCheckedChange,
  disabled,
  busy,
  labelledBy,
  describedBy,
  className,
}: {
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  disabled?: boolean;
  busy?: boolean;
  labelledBy: string;
  describedBy?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      aria-busy={busy || undefined}
      disabled={disabled || busy}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-[2.6rem] shrink-0 cursor-pointer items-center rounded-full",
        "transition-colors duration-200 ease-out",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet",
        "disabled:cursor-not-allowed disabled:opacity-60",
        checked ? "bg-violet" : "bg-line-strong",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none block size-[1.15rem] rounded-full bg-white shadow-[0_1px_3px_rgb(21_21_44_/_0.25)]",
          "transition-transform duration-200 ease-out",
          checked ? "translate-x-[1.3rem]" : "translate-x-[0.2rem]",
        )}
      />
    </button>
  );
}
