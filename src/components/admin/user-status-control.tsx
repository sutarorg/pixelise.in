"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, UserCheck, UserX, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label, Textarea } from "@/components/ui/field";
import { updateUserStatus } from "@/lib/api/admin";
import type { AdminUserRow } from "@/lib/api/admin-types";
import { cn } from "@/lib/utils";

/**
 * Account suspension / reactivation.
 *
 * The console asks the service to change the status; it never edits a user row
 * itself. A reason is mandatory because the suspension is auditable, and the
 * dialog says what will happen to the account's credits and history (nothing —
 * suspension is not deletion).
 */
export function UserStatusControl({
  user,
  canWrite,
  canWriteReason,
}: {
  user: Pick<AdminUserRow, "id" | "displayName" | "email" | "status">;
  canWrite: boolean;
  canWriteReason?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const suspending = user.status !== "suspended";
  const label = suspending ? "Suspend account" : "Reactivate account";
  const trimmed = reason.trim();
  const reasonValid = trimmed.length >= 10;

  function handleOpenChange(next: boolean) {
    if (pending) return;
    setOpen(next);
    if (!next) {
      setReason("");
      setError(null);
    }
  }

  async function submit() {
    if (!reasonValid || pending) return;
    setPending(true);
    setError(null);
    const response = await updateUserStatus(user.id, {
      status: suspending ? "suspended" : "active",
      reason: trimmed,
    });
    setPending(false);
    if (response.ok) {
      setOpen(false);
      setReason("");
      router.refresh();
      return;
    }
    setError(
      response.error.code === "forbidden"
        ? "The service refused this change: this admin doesn't have the users:write permission."
        : response.error.code === "not_configured"
          ? "This build has no admin API endpoint, so the account was not changed."
          : response.error.message,
    );
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Trigger asChild>
        <Button
          size="sm"
          variant={suspending ? "secondary" : "primary"}
          disabled={!canWrite}
          title={!canWrite ? canWriteReason : undefined}
          className={cn("h-8 text-[0.75rem]", suspending && "text-[#7d2a22] hover:text-[#7d2a22]")}
        >
          {suspending ? (
            <UserX className="size-3.5" aria-hidden="true" />
          ) : (
            <UserCheck className="size-3.5" aria-hidden="true" />
          )}
          {label}
        </Button>
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-ink/35 backdrop-blur-[2px] data-[state=open]:animate-overlay-in" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-1.5rem)] max-w-[27rem] -translate-x-1/2 -translate-y-1/2 rounded-[14px] border border-line bg-white p-4 shadow-float data-[state=open]:animate-overlay-in sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <DialogPrimitive.Title className="text-[1rem] font-bold tracking-[-0.02em] text-ink">
              {label}?
            </DialogPrimitive.Title>
            <DialogPrimitive.Close
              aria-label="Close"
              disabled={pending}
              className="-mr-1 -mt-1 grid size-8 shrink-0 place-items-center rounded-lg text-muted hover:bg-ink/[0.05] hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet"
            >
              <X className="size-4" strokeWidth={2} />
            </DialogPrimitive.Close>
          </div>

          <DialogPrimitive.Description asChild>
            <div className="mt-2 text-[0.8125rem] leading-[1.6] text-muted-strong">
              <p className="font-semibold text-ink-soft">
                {user.displayName?.trim() || user.email}
              </p>
              <p className="mt-1">
                {suspending
                  ? "Sign-in and new generations are blocked. Existing credits, creations and payment records are kept, and the account can be reactivated."
                  : "Sign-in and generation access are restored. Credits and history were never changed by the suspension."}
              </p>
            </div>
          </DialogPrimitive.Description>

          <div className="mt-3">
            <Label htmlFor="status-reason" className="mb-1.5 text-[0.75rem]">
              Reason <span className="font-normal text-muted">(required, min 10 characters)</span>
            </Label>
            <Textarea
              id="status-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="e.g. Repeated policy violations confirmed in support ticket #5120"
              className="min-h-[4.75rem] text-[0.875rem]"
              aria-invalid={reason.length > 0 && !reasonValid ? true : undefined}
            />
            {!canWrite ? (
              <p className="mt-1.5 flex items-start gap-1.5 text-[0.71875rem] text-[#7d2a22]">
                <AlertTriangle className="mt-px size-3 shrink-0" aria-hidden="true" />
                {canWriteReason}
              </p>
            ) : null}
            {error ? (
              <p role="alert" className="mt-2 rounded-[8px] bg-[#fdf1f0] px-2.5 py-1.5 text-[0.75rem] text-[#7d2a22]">
                {error}
              </p>
            ) : null}
          </div>

          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <DialogPrimitive.Close asChild>
              <Button variant="secondary" size="sm" className="h-9" disabled={pending}>
                Cancel
              </Button>
            </DialogPrimitive.Close>
            <Button
              size="sm"
              className={cn("h-9", suspending && "bg-[#c4342a] hover:bg-[#a52b22]")}
              onClick={submit}
              disabled={!reasonValid || pending || !canWrite}
            >
              {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
              {pending ? "Sending…" : label}
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
