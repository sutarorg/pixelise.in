"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { signOut } from "@/lib/api/browser";
import { formatDateTime } from "@/lib/format";

/**
 * Security settings.
 *
 * Nothing here pretends to change a password: password and session management
 * belong to the authentication service that arrives in stage 3. The one action
 * that exists — sign out — is wired to the real endpoint and reports failure
 * honestly instead of faking a redirect.
 */
export function SecuritySection({
  signedInAt,
  lastSignInAt,
  hasSession = true,
}: {
  signedInAt: string | null;
  lastSignInAt: string | null;
  hasSession?: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSignOut() {
    setPending(true);
    setError(null);
    const result = await signOut();
    setPending(false);
    if (result.ok) {
      router.push("/");
      router.refresh();
      return;
    }
    setError(
      result.error.code === "not_configured"
        ? "Signing out needs the account service, which isn't connected in this environment."
        : result.error.message,
    );
  }

  return (
    <div className="divide-y divide-line">
      <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[0.875rem] font-semibold text-ink">
            <KeyRound className="size-4 text-muted" strokeWidth={1.9} aria-hidden="true" />
            Password and sign-in
          </p>
          <p className="mt-1 max-w-[52ch] text-[0.75rem] leading-[1.6] text-muted-strong">
            Pixelise accounts are created with the authentication service. Password reset,
            verification and two-factor options are delivered with it — this build doesn&apos;t
            simulate them.
          </p>
        </div>
        <div className="shrink-0 text-left sm:text-right">
          {lastSignInAt ? (
            <p className="text-[0.6875rem] text-muted">
              Last sign-in
              <span className="mt-0.5 block font-semibold text-ink-soft">
                {formatDateTime(lastSignInAt)}
              </span>
            </p>
          ) : (
            <p className="text-[0.6875rem] text-muted">Session details come from the service</p>
          )}
        </div>
      </div>

      <div className="px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[0.875rem] font-semibold text-ink">This session</p>
            <p className="mt-1 text-[0.75rem] leading-[1.6] text-muted-strong">
              {!hasSession
                ? "No session is connected in this environment, so there is nothing to end."
                : `${signedInAt ? `Signed in ${formatDateTime(signedInAt)}.` : "Signed in on this device."} Signing out ends this session only.`}
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={handleSignOut}
            disabled={pending || !hasSession}
            className="shrink-0"
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <LogOut className="size-4" aria-hidden="true" />
            )}
            {pending ? "Signing out…" : "Sign out"}
          </Button>
        </div>

        {error ? (
          <Alert tone="danger" live className="mt-3">
            {error}
          </Alert>
        ) : null}
      </div>

      <div className="px-4 py-4 sm:px-5">
        <p className="text-[0.875rem] font-semibold text-ink">Downloads and links</p>
        <p className="mt-1 max-w-[60ch] text-[0.75rem] leading-[1.6] text-muted-strong">
          Download links you copy from a creation are time-limited by the storage service. Generate
          a fresh download from the creation page if an old link has expired.
        </p>
      </div>

      <p className="px-4 py-3 text-[0.6875rem] text-muted sm:px-5">
        Signed-in state is refreshed from the service on every page load, not stored in the browser.
      </p>
    </div>
  );
}
