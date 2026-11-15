"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDown, ExternalLink, ShieldCheck } from "lucide-react";

import { cn } from "@/lib/utils";
import { AdminSignOut } from "@/components/admin/admin-sign-out";
import type { AdminAccount } from "@/components/admin/admin-sidebar";

/**
 * Admin identity menu. A disclosure, not `role="menu"`: the items are links and
 * a button, so arrow-key menu semantics would be a promise this control does not
 * keep. Escape closes it and returns focus to the trigger.
 */
export function ProfileMenu({ account }: { account: AdminAccount | null }) {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent | TouchEvent) {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const initials = account
    ? (account.displayName?.trim()?.[0] ?? account.email[0])?.toUpperCase()
    : null;
  const name = account?.displayName?.trim() || account?.email || "Console access";

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="admin-profile-panel"
        className="inline-flex h-9 items-center gap-2 rounded-[8px] border border-line-strong bg-white pl-1 pr-2 transition-colors hover:border-ink/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet"
      >
        <span
          aria-hidden="true"
          className="grid size-7 place-items-center rounded-full bg-ink text-[0.6875rem] font-bold text-white"
        >
          {initials ?? "·"}
        </span>
        <span className="hidden max-w-[9rem] truncate text-[0.75rem] font-bold text-ink sm:block">
          {name}
        </span>
        <ChevronDown
          className={cn(
            "size-3.5 text-muted transition-transform duration-150",
            open && "rotate-180",
          )}
          strokeWidth={2.2}
          aria-hidden="true"
        />
        <span className="sr-only">Account menu</span>
      </button>

      {open ? (
        <div
          id="admin-profile-panel"
          ref={panelRef}
          className="absolute right-0 top-[calc(100%+6px)] z-40 w-[16rem] rounded-[10px] border border-line bg-white p-1.5 shadow-float"
        >
          <div className="rounded-[7px] bg-surface px-2.5 py-2">
            <p className="truncate text-[0.75rem] font-bold text-ink">{name}</p>
            <p className="truncate text-[0.6875rem] text-muted">{account?.email ?? "—"}</p>
            <p className="mt-1.5 inline-flex items-center gap-1 text-[0.65625rem] font-bold uppercase tracking-[0.08em] text-violet-ink">
              <ShieldCheck className="size-3" strokeWidth={2.2} aria-hidden="true" />
              {account?.role ?? "No role"}
            </p>
          </div>
          <Link
            href="/"
            className="mt-1 flex h-8 items-center gap-2 rounded-[7px] px-2.5 text-[0.75rem] font-semibold text-ink-soft hover:bg-ink/[0.04] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet"
          >
            <ExternalLink className="size-3.5 text-muted" strokeWidth={2} aria-hidden="true" />
            Return to pixelise.in
          </Link>
          <div className="mt-1 border-t border-line px-2.5 py-2">
            <AdminSignOut compact />
          </div>
        </div>
      ) : null}
    </div>
  );
}
