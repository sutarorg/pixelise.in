"use client";

import { useRouter } from "next/navigation";

import { Sheet, SheetContent } from "@/components/ui/sheet";

/**
 * Right-hand record panel driven by the URL (`?record=<id>`), so opening a record
 * is a navigation: the link is shareable, Back closes the panel, and the content
 * is read on the server with the same authorization as the list.
 *
 * Radix supplies the focus trap and Escape handling; closing pushes the URL
 * without the record, which restores the filtered list underneath.
 */
export function DetailDrawer({
  open,
  closeHref,
  title,
  description,
  children,
}: {
  open: boolean;
  closeHref: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) router.push(closeHref, { scroll: false });
      }}
    >
      <SheetContent
        title={title}
        description={description ?? title}
        closeLabel="Close record panel"
        portal={false}
        className="w-[min(36rem,96vw)]"
      >
        {children}
      </SheetContent>
    </Sheet>
  );
}
