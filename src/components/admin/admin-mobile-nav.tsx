"use client";

import * as React from "react";
import Link from "next/link";
import { Menu } from "lucide-react";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AdminNav } from "@/components/admin/admin-nav";
import { AdminSignOut } from "@/components/admin/admin-sign-out";

/** Phone navigation: the same sections, in a focus-trapped drawer. */
export function AdminMobileNav() {
  const [open, setOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="grid size-9 shrink-0 place-items-center rounded-[8px] border border-line-strong bg-white text-ink-soft transition-colors hover:border-ink/25 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet lg:hidden"
          aria-label="Open console navigation"
        >
          <Menu className="size-[1.05rem]" strokeWidth={2} aria-hidden="true" />
        </button>
      </SheetTrigger>
      <SheetContent
        title="Console"
        description="Console sections. Choosing one closes this panel."
        className="w-[min(17rem,88vw)]"
      >
        <div className="flex h-full flex-col">
          <AdminNav onNavigate={() => setOpen(false)} />
          <div className="mt-auto border-t border-line pt-3">
            <Link
              href="/"
              className="mb-3 inline-flex items-center rounded text-[0.75rem] font-semibold text-muted-strong hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet"
            >
              Return to website
            </Link>
            <AdminSignOut />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
