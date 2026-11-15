"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Right-hand drawer built on Radix Dialog: focus trap, Escape to close,
 * scroll lock and `aria-modal` semantics come from the primitive.
 */
export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;

export function SheetContent({
  className,
  children,
  title,
  description,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  title: string;
  description?: string;
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        className={cn(
          "fixed inset-0 z-50 bg-ink/35 backdrop-blur-[2px]",
          "data-[state=open]:animate-overlay-in",
        )}
      />
      <DialogPrimitive.Content
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex h-full w-[min(23rem,92vw)] flex-col",
          "border-l border-line bg-white shadow-float",
          "data-[state=open]:animate-drawer-in",
          className,
        )}
        {...props}
      >
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
          <DialogPrimitive.Title className="text-[0.9375rem] font-semibold tracking-[-0.01em] text-ink">
            {title}
          </DialogPrimitive.Title>
          <DialogPrimitive.Close
            className="-mr-1 grid size-9 cursor-pointer place-items-center rounded-lg text-muted transition-colors hover:bg-ink/[0.05] hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet"
            aria-label="Close menu"
          >
            <X className="size-[1.15rem]" strokeWidth={1.9} />
          </DialogPrimitive.Close>
        </div>
        {description ? (
          <DialogPrimitive.Description className="sr-only">
            {description}
          </DialogPrimitive.Description>
        ) : null}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-6">
          {children}
        </div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
