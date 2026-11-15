"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ScrollText,
  Settings2,
  Sparkles,
  CpuIcon,
  LayoutDashboard,
  ReceiptText,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { adminNavGroups, type AdminNavIcon } from "@/config/admin";

const icons: Record<AdminNavIcon, LucideIcon> = {
  overview: LayoutDashboard,
  users: Users,
  generations: Sparkles,
  payments: ReceiptText,
  credits: Wallet,
  models: CpuIcon,
  config: Settings2,
  audit: ScrollText,
};

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin" || pathname === "/admin/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Console navigation. Only one item is ever `aria-current="page"`, and the
 * current section is also announced after the group label so the active page is
 * discoverable without relying on colour.
 */
export function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname() ?? "";
  const current = adminNavGroups
    .flatMap((group) => group.items)
    .find((item) => isActive(pathname, item.href));

  return (
    <nav aria-label="Console sections" className="flex-1 overflow-y-auto px-2.5 py-4">
      {adminNavGroups.map((group) => (
        <div key={group.label} className="mb-5 last:mb-0">
          <p className="px-2.5 text-[0.625rem] font-bold uppercase tracking-[0.16em] text-muted/90">
            {group.label}
          </p>
          <ul className="mt-1.5 space-y-px">
            {group.items.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = icons[item.icon];
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onClick={onNavigate}
                    className={cn(
                      "group relative flex h-8 items-center gap-2 rounded-[7px] px-2.5",
                      "text-[0.8125rem] font-semibold tracking-[-0.005em]",
                      "transition-colors duration-150",
                      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet",
                      active
                        ? "bg-tint text-violet-ink"
                        : "text-ink-soft hover:bg-ink/[0.035] hover:text-ink",
                    )}
                  >
                    {active ? (
                      <span
                        aria-hidden="true"
                        className="absolute inset-y-1.5 left-0 w-[2px] rounded-full bg-violet"
                      />
                    ) : null}
                    <Icon
                      className={cn(
                        "size-[0.95rem] shrink-0",
                        active ? "text-violet" : "text-muted group-hover:text-ink-soft",
                      )}
                      strokeWidth={1.9}
                      aria-hidden="true"
                    />
                    <span className="truncate">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      <p className="sr-only" aria-live="polite">
        {current ? `${current.label} section` : ""}
      </p>
    </nav>
  );
}
