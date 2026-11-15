"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Loader2, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";

export type ConfirmOutcome = { ok: true } | { ok: false; message: string };

export interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
  /** When set, the user must type this phrase before confirming. */
  requirePhrase?: string;
  /** Returning `{ ok: false }` keeps the dialog open with the message. */
  onConfirm: () => Promise<ConfirmOutcome>;
}

/**
 * Radix Dialog gives the focus trap, Escape handling, scroll lock and correct
 * `aria-modal` semantics. Nothing here performs the action itself: the caller
 * decides what confirming means and every failure is shown in place.
 */
export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  tone = "default",
  requirePhrase,
  onConfirm,
}: ConfirmationDialogProps) {
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [phrase, setPhrase] = React.useState("");
  const phraseOk = !requirePhrase || phrase.trim() === requirePhrase;

  /* Opening starts clean; closing discards anything half-typed. Doing this in
     the open-change handler avoids a state write during render or in an effect. */
  const handleOpenChange = React.useCallback(
    (next: boolean) => {
      if (!next) {
        setPending(false);
        setError(null);
        setPhrase("");
      }
      onOpenChange(next);
    },
    [onOpenChange],
  );

  async function handleConfirm() {
    if (pending || !phraseOk) return;
    setPending(true);
    setError(null);
    const outcome = await onConfirm();
    setPending(false);
    if (outcome.ok) {
      handleOpenChange(false);
    } else {
      setError(outcome.message);
    }
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-ink/35 backdrop-blur-[2px] data-[state=open]:animate-overlay-in" />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-[27rem] -translate-x-1/2 -translate-y-1/2",
            "rounded-[16px] border border-line bg-white p-5 shadow-float sm:p-6",
            "data-[state=open]:animate-overlay-in",
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <DialogPrimitive.Title className="text-[1.0625rem] font-bold tracking-[-0.02em] text-ink">
              {title}
            </DialogPrimitive.Title>
            <DialogPrimitive.Close
              aria-label="Close"
              className="-mr-1 -mt-1 grid size-9 shrink-0 cursor-pointer place-items-center rounded-lg text-muted transition-colors hover:bg-ink/[0.05] hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet"
            >
              <X className="size-4" strokeWidth={2} />
            </DialogPrimitive.Close>
          </div>

          <DialogPrimitive.Description asChild>
            <div className="mt-2 text-[0.875rem] leading-[1.65] text-muted-strong">
              {description}
            </div>
          </DialogPrimitive.Description>

          {requirePhrase ? (
            <div className="mt-4">
              <Label htmlFor="confirm-phrase" className="mb-1.5">
                Type <span className="font-mono text-[0.8125rem]">{requirePhrase}</span> to confirm
              </Label>
              <Input
                id="confirm-phrase"
                value={phrase}
                onChange={(event) => setPhrase(event.target.value)}
                autoComplete="off"
                aria-invalid={!phraseOk && phrase.length > 0 ? true : undefined}
              />
            </div>
          ) : null}

          {error ? (
            <p role="alert" className="mt-3 rounded-[10px] bg-[#fdf1f0] px-3 py-2 text-[0.8125rem] text-[#7d2a22]">
              {error}
            </p>
          ) : null}

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <DialogPrimitive.Close asChild>
              <Button variant="secondary" size="md" disabled={pending}>
                {cancelLabel}
              </Button>
            </DialogPrimitive.Close>
            <Button
              variant={tone === "danger" ? "primary" : "primary"}
              size="md"
              onClick={handleConfirm}
              disabled={pending || !phraseOk}
              className={cn(tone === "danger" && "bg-[#c4342a] hover:bg-[#a52b22]")}
            >
              {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
              {pending ? "Working…" : confirmLabel}
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
