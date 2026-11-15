"use client";

import { usePathname } from "next/navigation";

import { Breadcrumbs, type Crumb } from "@/components/admin/breadcrumbs";
import { AdminMobileNav } from "@/components/admin/admin-mobile-nav";
import { ProfileMenu } from "@/components/admin/profile-menu";
import type { AdminAccount } from "@/components/admin/admin-sidebar";

const labels: Record<string, string> = {
  admin: "Console",
  users: "Users",
  generations: "Generations",
  payments: "Payments",
  credits: "Credit Ledger",
  models: "AI Models",
  settings: "Configuration",
  "audit-logs": "Audit Logs",
};

/**
 * Derives the trail from the URL so every page gets one without passing props
 * through the layout. Record pages are labelled by section, and the record's own
 * identifier is shown in the page body rather than buried in a crumb.
 */
function crumbsFor(pathname: string): Crumb[] {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length <= 1) return [{ label: "Console" }];

  const section = segments[1];
  const sectionLabel = labels[section] ?? section;

  if (segments.length === 2) {
    return [{ label: "Console", href: "/admin" }, { label: sectionLabel }];
  }

  const recordLabel = section === "users" ? "Customer record" : "Record detail";
  return [
    { label: "Console", href: "/admin" },
    { label: sectionLabel, href: `/admin/${section}` },
    { label: recordLabel },
  ];
}

export function AdminHeader({ account }: { account: AdminAccount | null }) {
  const pathname = usePathname() ?? "/admin";

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-line bg-white/95 px-3 backdrop-blur sm:px-5">
      <AdminMobileNav />
      <div className="min-w-0 flex-1">
        <Breadcrumbs items={crumbsFor(pathname)} />
      </div>
      <p className="hidden text-[0.6875rem] font-semibold text-muted md:block">
        Internal operations console
      </p>
      <ProfileMenu account={account} />
    </header>
  );
}
