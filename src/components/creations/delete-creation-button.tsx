"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { deleteGeneration } from "@/lib/api/browser";

/**
 * Deletes one creation after an explicit confirmation. The list is only updated
 * after the service confirms the delete — nothing is hidden optimistically.
 */
export function DeleteCreationButton({
  id,
  label,
  variant = "icon",
  onDeleted,
}: {
  id: string;
  /** Human description of the visual, for the dialog and the aria-label. */
  label: string;
  variant?: "icon" | "button";
  onDeleted?: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  return (
    <>
      {variant === "icon" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`Delete ${label}`}
          className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-[#fdf1f0] hover:text-[#a52b22] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet"
        >
          <Trash2 className="size-3.5" strokeWidth={2} aria-hidden="true" />
        </button>
      ) : (
        <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(true)}>
          <Trash2 className="size-3.5" aria-hidden="true" />
          Delete visual
        </Button>
      )}

      <ConfirmationDialog
        open={open}
        onOpenChange={setOpen}
        tone="danger"
        title="Delete this visual?"
        description={
          <>
            <span className="block">
              <strong className="font-semibold text-ink">{label}</strong> will be removed from your
              creations and its download link will stop working.
            </span>
            <span className="mt-2 block text-[0.8125rem] text-muted">
              Credits already spent on this generation are not returned. Your original product photo
              stays untouched.
            </span>
          </>
        }
        confirmLabel="Delete visual"
        onConfirm={async () => {
          const result = await deleteGeneration(id);
          if (result.ok) {
            onDeleted?.();
            router.refresh();
            return { ok: true };
          }
          return {
            ok: false,
            message:
              result.error.code === "not_configured"
                ? "Deleting needs the Pixelise service, which isn't connected in this environment."
                : result.error.message,
          };
        }}
      />
    </>
  );
}

/** Inline pending state for a page-level delete. */
export function DeletePending({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[0.75rem] text-muted", className)}>
      <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
      Deleting…
    </span>
  );
}
