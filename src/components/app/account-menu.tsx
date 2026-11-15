"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, LifeBuoy, LogOut, Settings, User } from "lucide-react";

import { cn } from "@/lib/utils";
import { signOut } from "@/lib/api/browser";

export interface AccountMenuUser {
  displayName: string | null;
  email: string;
  initials: string | null;
}

/**
 * Account dropdown as an APG disclosure, not a `role="menu"`: these are
 * navigation links, and a menu role would promise arrow-key semantics the
 * element does not implement. Escape closes and returns focus to the trigger.
 */
export function AccountMenu({
  user,
  signInHref,
}: {
  user: AccountMenuUser | null;
  signInHref: string;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);

  const close = React.useCallback(() => setOpen(false), []);

  React.useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent | TouchEvent) {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      close();
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        close();
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
  }, [open, close]);

  async function handleSignOut() {
    setPending(true);
    setError(null);
    const result = await signOut();
    setPending(false);
    if (result.ok) {
      setOpen(false);
      router.push("/");
      router.refresh();
      return;
    }
    setError(
      result.error.code === "not_configured"
        ? "Sign-out is handled by the account service, which isn't connected yet."
        : result.error.message,
    );
  }

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls="account-panel"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "inline-flex h-9 items-center gap-1.5 rounded-full pl-1 pr-2",
          "transition-colors hover:bg-ink/[0.04]",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet",
        )}
      >
        <span className="sr-only">
          {user ? `Account menu for ${user.email}` : "Account menu"}
        </span>
        <span
          aria-hidden="true"
          className={cn(
            "grid size-[1.9rem] place-items-center rounded-full border border-violet/15 bg-tint",
            "text-[0.75rem] font-bold text-violet-ink",
          )}
        >
          {user?.initials ?? <User className="size-4" strokeWidth={2} />}
        </span>
        <ChevronDown
          className={cn("size-3.5 text-muted transition-transform", open && "rotate-180")}
          strokeWidth={2.2}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <div
          ref={panelRef}
          id="account-panel"
          className={cn(
            "absolute right-0 top-full z-50 mt-2 w-[15.5rem] origin-top-right",
            "rounded-[14px] border border-line bg-white p-1.5 shadow-float",
            "animate-menu-in",
          )}
        >
          <div className="border-b border-line px-2.5 pb-2.5 pt-2">
            <p className="truncate text-[0.8125rem] font-bold text-ink">
              {user?.displayName ?? (user ? "Your account" : "Not signed in")}
            </p>
            {user ? (
              <p className="truncate text-[0.75rem] text-muted">{user.email}</p>
            ) : (
              <p className="text-[0.75rem] text-muted">Account details need a connection.</p>
            )}
          </div>

          <ul className="py-1">
            <li>
              <Link
                href="/settings"
                onClick={close}
                className="flex h-9 items-center gap-2.5 rounded-[8px] px-2.5 text-[0.8125rem] font-semibold text-ink-soft hover:bg-tint hover:text-violet-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet"
              >
                <Settings className="size-4 text-muted" strokeWidth={1.9} aria-hidden="true" />
                Settings
              </Link>
            </li>
            <li>
              <Link
                href="/help"
                onClick={close}
                className="flex h-9 items-center gap-2.5 rounded-[8px] px-2.5 text-[0.8125rem] font-semibold text-ink-soft hover:bg-tint hover:text-violet-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet"
              >
                <LifeBuoy className="size-4 text-muted" strokeWidth={1.9} aria-hidden="true" />
                Help &amp; support
              </Link>
            </li>
          </ul>

          {error ? (
            <p role="alert" className="mx-1 mb-1 rounded-[8px] bg-[#fdf1f0] px-2 py-1.5 text-[0.71875rem] leading-[1.5] text-[#7d2a22]">
              {error}
            </p>
          ) : null}

          <div className="border-t border-line pt-1">
            {user ? (
              <button
                type="button"
                onClick={handleSignOut}
                disabled={pending}
                className="flex h-9 w-full items-center gap-2.5 rounded-[8px] px-2.5 text-left text-[0.8125rem] font-semibold text-ink-soft hover:bg-ink/[0.04] disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet"
              >
                <LogOut className="size-4 text-muted" strokeWidth={1.9} aria-hidden="true" />
                {pending ? "Signing out…" : "Sign out"}
              </button>
            ) : (
              <Link
                href={signInHref}
                onClick={close}
                className="flex h-9 items-center gap-2.5 rounded-[8px] px-2.5 text-[0.8125rem] font-semibold text-violet-ink hover:bg-tint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
