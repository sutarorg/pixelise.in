"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import type { NavItem } from "@/config/navigation";

/**
 * Navigation disclosure (ARIA APG “disclosure navigation menu” pattern).
 *
 * A plain button with `aria-expanded`/`aria-controls` reveals a list of links —
 * not an application menu, so no `role="menu"`. Opens on hover for pointer users,
 * on click/Enter/Space for keyboard users, closes on Escape (returning focus to
 * the trigger), on focus leaving the group, and on outside pointer-down.
 */
export function ResourcesMenu({
  item,
  active,
}: {
  item: NavItem;
  active: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const closeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const panelId = React.useId();

  const cancelClose = React.useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const scheduleClose = React.useCallback(() => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), 160);
  }, [cancelClose]);

  React.useEffect(() => cancelClose, [cancelClose]);

  React.useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className="relative"
      onPointerEnter={() => {
        cancelClose();
        setOpen(true);
      }}
      onPointerLeave={scheduleClose}
      onBlur={(event) => {
        if (!rootRef.current?.contains(event.relatedTarget as Node)) setOpen(false);
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "relative inline-flex cursor-pointer items-center gap-1 rounded-lg px-3 py-2",
          "text-[0.875rem] font-semibold tracking-[-0.005em] transition-colors",
          "hover:bg-ink/[0.04] hover:text-ink",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet",
          active || open ? "text-ink" : "text-ink-soft",
        )}
      >
        {item.label}
        <ChevronDown
          className={cn(
            "size-3.5 text-muted transition-transform duration-200",
            open && "-rotate-180",
          )}
          strokeWidth={2}
          aria-hidden="true"
        />
      </button>

      <div
        id={panelId}
        hidden={!open}
        className="absolute left-0 top-full z-50 pt-2.5"
        onPointerEnter={cancelClose}
        onPointerLeave={scheduleClose}
      >
        <ul
          className={cn(
            "w-[19rem] rounded-[14px] border border-line bg-white p-1.5 shadow-float",
            "data-[open=true]:animate-menu-in",
          )}
          data-open={open}
        >
          {item.children?.map((child) => (
            <li key={child.href}>
              <Link
                href={child.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex flex-col gap-0.5 rounded-[10px] px-3 py-2.5",
                  "transition-colors hover:bg-surface",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet",
                )}
              >
                <span className="text-[0.875rem] font-semibold text-ink">
                  {child.label}
                </span>
                {child.description ? (
                  <span className="text-[0.75rem] leading-[1.45] text-muted">
                    {child.description}
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
