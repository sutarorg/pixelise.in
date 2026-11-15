"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { primaryNav } from "@/config/navigation";
import { links, routes } from "@/config/site";

export function MobileNav() {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  const flatLinks = [
    ...primaryNav.filter((item) => !item.children),
    ...primaryNav.filter((item) => item.children).flatMap((item) => item.children ?? []),
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Open menu"
          className={cn(
            "-mr-1.5 grid size-10 cursor-pointer place-items-center rounded-lg border border-line",
            "text-ink transition-colors hover:bg-ink/[0.04]",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet",
          )}
        >
          <Menu className="size-[1.15rem]" strokeWidth={1.9} aria-hidden="true" />
        </button>
      </SheetTrigger>
      <SheetContent title="Menu" description="Pixelise site navigation">
        <nav aria-label="Mobile" className="flex flex-col">
          {flatLinks.map((item, index) => {
            const active = pathname === item.href;
            return (
              <SheetClose asChild key={`${item.href}-${index}`}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "border-b border-line py-3.5 text-[1.0625rem] font-semibold tracking-[-0.015em]",
                    active ? "text-violet-ink" : "text-ink",
                  )}
                >
                  {item.label}
                </Link>
              </SheetClose>
            );
          })}
        </nav>

        <div className="mt-8 flex flex-col gap-2.5">
          <Button asChild size="lg">
            <SheetClose asChild>
              <Link href={links.getStarted}>Get started</Link>
            </SheetClose>
          </Button>
          <Button asChild variant="secondary" size="lg">
            <SheetClose asChild>
              <Link href={links.login}>Log in</Link>
            </SheetClose>
          </Button>
        </div>

        <p className="mt-6 text-micro text-muted">
          Creator ₹499 · Studio ₹999 — one-time credit packs.
        </p>
        <p className="mt-1 text-micro text-muted">
          <Link href={routes.contact} className="underline decoration-line-strong underline-offset-4">
            Contact support
          </Link>
        </p>
      </SheetContent>
    </Sheet>
  );
}
