"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { signOut } from "@/lib/api/browser";

/**
 * Ends the session through the auth service and returns to the public site.
 * Failure is reported in place; the console never pretends the session ended.
 */
export function AdminSignOut({ compact = false }: { compact?: boolean }) {
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
        ? "The account service isn't connected in this build."
        : result.error.message,
    );
  }

  return (
    <div className={compact ? undefined : "w-full"}>
      <button
        type="button"
        onClick={handleSignOut}
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded text-[0.75rem] font-semibold text-muted-strong transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet disabled:opacity-60"
      >
        <LogOut className="size-3.5" strokeWidth={2} aria-hidden="true" />
        {pending ? "Signing out…" : "Sign out"}
      </button>
      {error ? (
        <p role="status" className="mt-1 text-[0.6875rem] leading-[1.4] text-[#7d2a22]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
