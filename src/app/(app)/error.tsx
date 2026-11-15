"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, RotateCw } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Route-level failure boundary for the workspace. It deliberately says nothing
 * about the cause: an unhandled error is ours, not the customer's, and the copy
 * makes clear that credits were not spent by a page that failed to render.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    /* Surfaced in the server logs; never shown to the customer. */
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto w-full max-w-[34rem] px-2 py-16 text-center sm:py-24">
      <span
        aria-hidden="true"
        className="mx-auto grid size-12 place-items-center rounded-[14px] border border-line bg-white text-[#a52b22]"
      >
        <AlertTriangle className="size-[1.35rem]" strokeWidth={1.8} />
      </span>
      <h1 className="mt-5 text-[1.375rem] font-extrabold tracking-[-0.03em] text-ink">
        This page didn&apos;t load
      </h1>
      <p className="mx-auto mt-2 max-w-[42ch] text-[0.875rem] leading-[1.65] text-muted-strong">
        Something failed while drawing this screen. Your credits and creations are safe — nothing was
        charged.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <Button type="button" size="md" onClick={reset}>
          <RotateCw className="size-4" aria-hidden="true" />
          Try again
        </Button>
        <Button asChild size="md" variant="secondary">
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </div>

      {error.digest ? (
        <p className="mt-6 text-[0.6875rem] text-muted">
          Reference <span className="font-mono text-ink-soft">{error.digest}</span>
        </p>
      ) : null}
    </div>
  );
}
