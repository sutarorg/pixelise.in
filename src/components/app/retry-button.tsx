"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, RotateCw } from "lucide-react";

import { Button, type ButtonProps } from "@/components/ui/button";

/**
 * Re-renders the current route's server components. Used by every error state
 * so a transient outage has a one-click recovery that does not lose the page.
 */
export function RetryButton({
  label = "Try again",
  size = "sm",
  variant = "secondary",
}: {
  label?: string;
  size?: ButtonProps["size"];
  variant?: ButtonProps["variant"];
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [timer, setTimer] = React.useState<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => () => { if (timer) clearTimeout(timer); }, [timer]);

  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      disabled={pending}
      onClick={() => {
        setPending(true);
        router.refresh();
        const next = setTimeout(() => setPending(false), 1200);
        setTimer(next);
      }}
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        <RotateCw className="size-4" aria-hidden="true" />
      )}
      {pending ? "Retrying…" : label}
    </Button>
  );
}
