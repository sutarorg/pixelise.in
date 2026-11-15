"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label, Textarea } from "@/components/ui/field";
import { updateModelSetting } from "@/lib/api/admin";
import type { AdminModel } from "@/lib/api/admin-types";
import { cn } from "@/lib/utils";

/**
 * Routing availability for one model.
 *
 * Only the routing flag is editable here. Credit rates and provider pricing are
 * not inputs: they are set by the service, need their own permission and are
 * audited when they change. Credentials are never part of this payload.
 */
export function ModelRoutingToggle({
  model,
  canWrite,
}: {
  model: Pick<AdminModel, "id" | "name" | "routingEnabled">;
  canWrite: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const nextEnabled = !model.routingEnabled;
  const label = nextEnabled ? "Enable routing" : "Disable routing";
  const reasonValid = reason.trim().length >= 10;

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
    const response = await updateModelSetting(model.id, {
      routingEnabled: nextEnabled,
      reason: reason.trim(),
    });
    setPending(false);
    if (response.ok) {
      setOpen(false);
      router.refresh();
      return;
    }
    setError(
      response.error.code === "forbidden"
        ? "The service refused this change: this admin doesn't have the models:write permission."
        : response.error.code === "not_configured"
          ? "This build has no admin API endpoint, so nothing was changed."
          : response.error.message,
    );
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Trigger asChild>
        <Button
          size="sm"
          variant="secondary"
          disabled={!canWrite}
          title={!canWrite ? "Requires the models:write permission." : undefined}
          className="h-7 text-[0.71875rem]"
        >
          {nextEnabled ? "Enable routing" : "Disable routing"}
        </Button>
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-ink/35 backdrop-blur-[2px] data-[state=open]:animate-overlay-in" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-1.5rem)] max-w-[27rem] -translate-x-1/2 -translate-y-1/2 rounded-[14px] border border-line bg-white p-4 shadow-float data-[state=open]:animate-overlay-in sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <DialogPrimitive.Title className="text-[1rem] font-bold tracking-[-0.02em] text-ink">
              {label} for {model.name}?
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
              <p>
                {nextEnabled
                  ? "New jobs may be routed to this model. It must already be available at the provider; the service does not invent capacity."
                  : "New jobs will stop using this model. Jobs already running are not interrupted, and credit pricing is unchanged."}
              </p>
              <p className="mt-1.5 flex items-start gap-1.5 text-[0.75rem]">
                <AlertTriangle className="mt-px size-3.5 shrink-0 text-[#a9791a]" aria-hidden="true" />
                The change is recorded in the audit log with your identity, the reason and the
                timestamp.
              </p>
            </div>
          </DialogPrimitive.Description>

          <div className="mt-3">
            <Label htmlFor="model-reason" className="mb-1.5 text-[0.75rem]">
              Reason <span className="font-normal text-muted">(required, min 10 characters)</span>
            </Label>
            <Textarea
              id="model-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="e.g. Provider incident INC-2291: shifting traffic while quality is degraded"
              className="min-h-[4.75rem] text-[0.875rem]"
              aria-invalid={reason.length > 0 && !reasonValid ? true : undefined}
            />
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
              className={cn("h-9", !nextEnabled && "bg-[#c4342a] hover:bg-[#a52b22]")}
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
