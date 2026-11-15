import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * Pixelise identity: a violet tile holding a two-by-two pixel block —
 * three solid cells and one still rendering — beside a tightened wordmark.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 28 28"
      className={cn("size-7", className)}
      aria-hidden="true"
      focusable="false"
    >
      <rect width="28" height="28" rx="8.2" fill="currentColor" />
      <rect x="6.6" y="6.6" width="6.6" height="6.6" rx="1.8" fill="#fff" />
      <rect x="14.8" y="6.6" width="6.6" height="6.6" rx="1.8" fill="#fff" opacity="0.55" />
      <rect x="6.6" y="14.8" width="6.6" height="6.6" rx="1.8" fill="#fff" opacity="0.55" />
      <rect x="14.8" y="14.8" width="6.6" height="6.6" rx="1.8" fill="#fff" />
    </svg>
  );
}

export function Logo({
  className,
  tone = "default",
  href = "/",
}: {
  className?: string;
  tone?: "default" | "inverse";
  href?: string;
}) {
  return (
    <Link
      href={href}
      aria-label="Pixelise — home"
      className={cn(
        "group inline-flex items-center gap-2.5 rounded-lg",
        "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet",
        className,
      )}
    >
      <LogoMark
        className={cn(
          "size-[1.7rem] text-violet transition-transform duration-200 group-hover:-rotate-3",
          tone === "inverse" && "text-white",
        )}
      />
      <span
        className={cn(
          "text-[1.1875rem] font-extrabold leading-none tracking-[-0.045em]",
          tone === "inverse" ? "text-white" : "text-ink",
        )}
      >
        Pixelise
      </span>
    </Link>
  );
}
