"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowUpRight, LogOut, User, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent } from "@/components/ui/sheet";
import { NavIcon } from "@/components/app/nav-icon";
import { mobileNav, mobileSheetNav } from "@/config/dashboard";
import type { AccountMenuUser } from "@/components/app/account-menu";

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Phone navigation: four destinations pinned to the bottom edge, plus an
 * account drawer for everything else. Targets are 56px tall, well past the
 * 24px WCAG 2.2 minimum, and the bar respects the device safe area.
 */
export function MobileNav({ user }: { user: AccountMenuUser | null }) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSignOut() {
    const { signOut } = await import("@/lib/api/browser");
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
        ? "Sign-out is handled by the account service, which isn't connected yet."
        : result.error.message,
    );
  }

  return (
    <>
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-canvas/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
      >
        <ul className="grid grid-cols-5">
          {mobileNav.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex h-14 flex-col items-center justify-center gap-1",
                    "text-[0.65625rem] font-semibold tracking-[0.01em]",
                    "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-violet",
                    active ? "text-violet-ink" : "text-muted-strong",
                  )}
                >
                  {active ? (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-5 top-0 h-0.5 rounded-full bg-violet"
                    />
                  ) : null}
                  <NavIcon name={item.icon} className={cn("size-[1.15rem]", active && "text-violet")} />
                  {item.label === "My Creations" ? "Creations" : item.label}
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-expanded={open}
              aria-haspopup="dialog"
              className={cn(
                "flex h-14 w-full flex-col items-center justify-center gap-1",
                "text-[0.65625rem] font-semibold tracking-[0.01em] text-muted-strong",
                "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-violet",
              )}
            >
              <span
                aria-hidden="true"
                className="grid size-[1.15rem] place-items-center rounded-full text-[0.6rem] font-bold"
              >
                {user?.initials ?? <User className="size-[1.15rem]" strokeWidth={1.9} />}
              </span>
              Account
            </button>
          </li>
        </ul>
      </nav>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          title="Account"
          description="Account, billing and support"
          className="w-[min(21rem,90vw)]"
        >
          <div className="flex items-center gap-3 rounded-[12px] border border-line bg-surface p-3">
            <span
              aria-hidden="true"
              className="grid size-9 shrink-0 place-items-center rounded-full border border-violet/15 bg-tint text-[0.75rem] font-bold text-violet-ink"
            >
              {user?.initials ?? <User className="size-4" strokeWidth={2} />}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[0.8125rem] font-bold text-ink">
                {user?.displayName ?? (user ? "Your account" : "Not signed in")}
              </p>
              <p className="truncate text-[0.75rem] text-muted">
                {user?.email ?? "No account is connected yet."}
              </p>
            </div>
            <SheetClose asChild>
              <button
                type="button"
                aria-label="Close account menu"
                className="ml-auto grid size-8 shrink-0 place-items-center rounded-lg text-muted hover:bg-ink/[0.05] hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet"
              >
                <X className="size-4" strokeWidth={2} aria-hidden="true" />
              </button>
            </SheetClose>
          </div>

          <ul className="mt-4 space-y-0.5">
            {mobileSheetNav.map((item) => (
              <li key={item.href}>
                <SheetClose asChild>
                  <Link
                    href={item.href}
                    className="flex items-start gap-3 rounded-[10px] px-2.5 py-2.5 hover:bg-tint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet"
                  >
                    <NavIcon name={item.icon} className="mt-0.5 size-[1.1rem] text-muted" />
                    <span>
                      <span className="block text-[0.875rem] font-semibold text-ink">
                        {item.label}
                      </span>
                      <span className="block text-[0.75rem] leading-[1.5] text-muted">
                        {item.description}
                      </span>
                    </span>
                  </Link>
                </SheetClose>
              </li>
            ))}
            <li>
              <Link
                href="/"
                className="flex items-center gap-3 rounded-[10px] px-2.5 py-2.5 text-[0.875rem] font-semibold text-ink-soft hover:bg-tint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet"
              >
                <ArrowUpRight className="size-[1.1rem] text-muted" strokeWidth={1.9} aria-hidden="true" />
                pixelise.in
              </Link>
            </li>
          </ul>

          {error ? (
            <p role="alert" className="mt-3 rounded-[10px] bg-[#fdf1f0] px-3 py-2 text-[0.75rem] leading-[1.55] text-[#7d2a22]">
              {error}
            </p>
          ) : null}

          {user ? (
            <div className="mt-4 border-t border-line pt-4">
              <Button
                variant="secondary"
                size="md"
                className="w-full"
                onClick={handleSignOut}
                disabled={pending}
              >
                <LogOut className="size-4" aria-hidden="true" />
                {pending ? "Signing out…" : "Sign out"}
              </Button>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  );
}
