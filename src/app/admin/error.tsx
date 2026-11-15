"use client";

import { useEffect } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

/**
 * Segment error boundary. Renders a bare recovery surface — no record data, no
 * stack trace — and keeps the console's navigation available by linking back.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    /* The service writes its own logs; this only makes the failure visible in the
       browser console during support, without exposing it in the page. */
    console.error("Console route error", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="mx-auto max-w-[34rem] rounded-[10px] border border-line bg-white p-5 sm:p-6">
      <p className="text-[0.65625rem] font-bold uppercase tracking-[0.12em] text-muted">
        Console error
      </p>
      <h1 className="mt-1.5 text-[1.125rem] font-bold tracking-[-0.02em] text-ink">
        This screen couldn&apos;t render
      </h1>
      <p className="mt-1.5 text-[0.8125rem] leading-[1.6] text-muted-strong">
        The request failed before any record could be displayed. Nothing was changed. Try again, or
        move to another section of the console.
      </p>
      {error.digest ? (
        <p className="mt-2 font-mono text-[0.6875rem] text-muted">digest {error.digest}</p>
      ) : null}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button size="sm" variant="secondary" className="h-9" onClick={reset}>
          Try again
        </Button>
        <Button asChild size="sm" variant="ghost" className="h-9">
          <Link href="/admin">Back to overview</Link>
        </Button>
      </div>
    </div>
  );
}
