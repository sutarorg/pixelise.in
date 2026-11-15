"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { allNav } from "@/config/dashboard";

/**
 * The current location, shown in the app header. Detail routes (`/creations/x`)
 * keep their parent section visible as a breadcrumb so the page never loses its
 * place in the hierarchy.
 */
export function HeaderTitle() {
  const pathname = usePathname() ?? "";
  const section = allNav.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );

  if (!section) return null;

  const isDetail = pathname !== section.href;

  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex items-center gap-2 text-[0.875rem]">
        <li className="min-w-0">
          {isDetail ? (
            <Link
              href={section.href}
              className="truncate rounded font-semibold text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet"
            >
              {section.label}
            </Link>
          ) : (
            <span aria-current="page" className="truncate font-semibold text-ink">
              {section.label}
            </span>
          )}
        </li>
        {isDetail ? (
          <>
            <li aria-hidden="true" className="text-line-strong">
              <ChevronRight className="size-3.5" strokeWidth={2.2} />
            </li>
            <li aria-current="page" className="truncate font-semibold text-ink">
              {section.href === "/creations" ? "Creation" : "Detail"}
            </li>
          </>
        ) : null}
      </ol>
    </nav>
  );
}
