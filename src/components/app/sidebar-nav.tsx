"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { NavIcon } from "@/components/app/nav-icon";
import { accountNav, workspaceNav, type NavItem } from "@/config/dashboard";

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavList({ items, pathname }: { items: NavItem[]; pathname: string }) {
  return (
    <ul className="mt-2 space-y-0.5">
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex h-10 items-center gap-2.5 rounded-[10px] px-2.5",
                "text-[0.84375rem] font-semibold tracking-[-0.005em]",
                "transition-colors duration-150",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet",
                active
                  ? "bg-tint text-violet-ink shadow-[inset_0_0_0_1px_rgb(96_69_245_/_0.10)]"
                  : "text-ink-soft hover:bg-ink/[0.035] hover:text-ink",
              )}
            >
              <NavIcon
                name={item.icon}
                className={cn(
                  "size-[1.1rem] transition-colors",
                  active ? "text-violet" : "text-muted group-hover:text-ink-soft",
                )}
              />
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function SidebarNav() {
  const pathname = usePathname() ?? "";

  return (
    <nav aria-label="Dashboard" className="flex-1 overflow-y-auto px-3 py-5">
      <p className="px-2.5 text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-muted/85">
        Workspace
      </p>
      <NavList items={workspaceNav} pathname={pathname} />

      <p className="mt-6 px-2.5 text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-muted/85">
        Account
      </p>
      <NavList items={accountNav} pathname={pathname} />
    </nav>
  );
}
