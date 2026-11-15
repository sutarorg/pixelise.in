"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { deleteAccount } from "@/lib/api/browser";

/**
 * Account deletion. Consequence-first copy, an explicit typed confirmation, and
 * a hard failure surface — the account is never marked deleted in the browser.
 */
export function DeleteAccountSection({ available = true }: { available?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  return (
    <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5">
      <div className="min-w-0">
        <p className="text-[0.875rem] font-semibold text-ink">Delete your account</p>
        <p className="mt-1 max-w-[58ch] text-[0.75rem] leading-[1.6] text-muted-strong">
          {available
            ? "This removes your profile, your creations and your remaining credit balance. Purchases are handled under the refund policy. Deletion can’t be undone."
            : "There is no connected account to delete in this environment. The action below becomes available once an account exists."}
        </p>
      </div>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        onClick={() => setOpen(true)}
        disabled={!available}
        className="shrink-0 border-[#f3c9c4] text-[#a52b22] hover:border-[#e2a9a2] hover:bg-[#fdf1f0]"
      >
        <Trash2 className="size-3.5" aria-hidden="true" />
        Delete account
      </Button>

      <ConfirmationDialog
        open={open}
        onOpenChange={setOpen}
        tone="danger"
        title="Delete your Pixelise account?"
        description={
          <>
            <span className="block">
              Your creations, uploaded photos and remaining credits are removed and cannot be
              recovered.
            </span>
            <span className="mt-2 block">
              Any purchase you made stays subject to the{" "}
              <a
                href="/refund-policy"
                className="font-semibold text-ink underline underline-offset-2"
              >
                refund policy
              </a>
              .
            </span>
          </>
        }
        requirePhrase="DELETE"
        confirmLabel="Delete account permanently"
        onConfirm={async () => {
          const result = await deleteAccount({ confirmation: "DELETE" });
          if (result.ok) {
            router.push("/");
            router.refresh();
            return { ok: true };
          }
          return {
            ok: false,
            message:
              result.error.code === "not_configured"
                ? "Deletion needs the Pixelise service, which isn't connected in this environment. Your account was not touched."
                : result.error.message,
          };
        }}
      />
    </div>
  );
}
