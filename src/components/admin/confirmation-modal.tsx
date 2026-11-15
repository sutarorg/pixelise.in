"use client";

import {
  ConfirmationDialog,
  type ConfirmOutcome,
} from "@/components/ui/confirmation-dialog";

/**
 * Admin-facing confirmation.
 *
 * Wraps the shared dialog (focus trap, Escape, scroll lock) rather than forking
 * it. Destructive actions default to the danger tone and can require a typed
 * phrase; the caller owns the request and returns the server's answer, which is
 * shown in place if it fails.
 */
export function ConfirmationModal({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  tone = "danger",
  requirePhrase,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
  requirePhrase?: string;
  onConfirm: () => Promise<ConfirmOutcome>;
}) {
  return (
    <ConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      confirmLabel={confirmLabel}
      cancelLabel={cancelLabel}
      tone={tone}
      requirePhrase={requirePhrase}
      onConfirm={onConfirm}
    />
  );
}
