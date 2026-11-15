import Link from "next/link";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { buildHref, type QueryRecord } from "@/lib/admin-filters";

export type DataTableColumn<T> = {
  id: string;
  header: string;
  sortable?: boolean;
  align?: "left" | "right";
  /** Cell content in the table view. */
  cell: (row: T) => React.ReactNode;
  /** Label in the phone card view. Omit to leave the value out of cards. */
  cardLabel?: string;
  /** Card value, when it differs from the table cell. */
  cardCell?: (row: T) => React.ReactNode;
  /** The column used as the card's heading on phones. */
  cardTitle?: boolean;
  className?: string;
};

/**
 * The console's one table component.
 *
 * Native `<table>` with `<caption>`, `<th scope="col">` and `aria-sort`; the sort
 * control is a real link inside the header cell, and only one column ever carries
 * an active sort. The scroll container is focusable and named so keyboard users
 * can scroll it (WCAG 2.1.1), and below `md` the same records render as a
 * definition list — no horizontal dragging on a phone (WCAG 1.4.10).
 */
export function DataTable<T>({
  caption,
  columns,
  rows,
  rowKey,
  basePath,
  query,
  sort,
  dir = "desc",
  cardNoun,
}: {
  caption: string;
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  basePath: string;
  query: QueryRecord;
  sort?: string;
  dir?: "asc" | "desc";
  /** Used in the mobile card list's screen-reader label. */
  cardNoun: string;
}) {
  const titleColumn = columns.find((column) => column.cardTitle) ?? columns[0];
  const cardColumns = columns.filter((column) => column.cardLabel && column !== titleColumn);

  return (
    <>
      <div
        role="region"
        aria-label={`${caption} — scrollable table`}
        tabIndex={0}
        className="hidden overflow-x-auto md:block focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-violet"
      >
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b border-line bg-white">
              {columns.map((column) => {
                const active = sort === column.id;
                const ariaSort = column.sortable
                  ? active
                    ? dir === "asc"
                      ? "ascending"
                      : "descending"
                    : "none"
                  : undefined;
                const nextDir = active && dir === "desc" ? "asc" : "desc";
                return (
                  <th
                    key={column.id}
                    scope="col"
                    aria-sort={ariaSort}
                    className={cn(
                      "sticky top-0 z-10 whitespace-nowrap bg-white px-3 py-2 text-[0.65625rem] font-bold uppercase tracking-[0.1em] text-muted",
                      column.align === "right" ? "text-right" : "text-left",
                      column.className,
                    )}
                  >
                    {column.sortable ? (
                      <Link
                        href={buildHref(basePath, {
                          ...query,
                          /* a new sort is a new result set: never carry a cursor into it */
                          cursor: undefined,
                          sort: column.id,
                          dir: nextDir,
                        })}
                        aria-label={`Sort by ${column.header}, ${
                          active
                            ? dir === "asc"
                              ? "currently ascending"
                              : "currently descending"
                            : "not sorted"
                        }`}
                        className={cn(
                          "inline-flex items-center gap-1 rounded text-inherit transition-colors hover:text-ink-soft",
                          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet",
                          active && "text-ink",
                        )}
                      >
                        {column.header}
                        {active ? (
                          dir === "asc" ? (
                            <ArrowUp className="size-3" strokeWidth={2.4} aria-hidden="true" />
                          ) : (
                            <ArrowDown className="size-3" strokeWidth={2.4} aria-hidden="true" />
                          )
                        ) : (
                          <ChevronsUpDown className="size-3 opacity-50" strokeWidth={2} aria-hidden="true" />
                        )}
                      </Link>
                    ) : (
                      column.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={rowKey(row)}
                className="border-b border-line/70 transition-colors last:border-0 hover:bg-surface/70"
              >
                {columns.map((column) => (
                  <td
                    key={column.id}
                    className={cn(
                      "px-3 py-2 text-[0.8125rem] text-ink-soft",
                      column.align === "right" ? "text-right tabular-nums" : "text-left",
                      column.className,
                    )}
                  >
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul aria-label={`${caption} — ${cardNoun}`} className="divide-y divide-line md:hidden">
        {rows.map((row) => (
          <li key={rowKey(row)} className="px-4 py-3">
            <div className="text-[0.875rem] font-bold text-ink">{titleColumn.cell(row)}</div>
            {cardColumns.length > 0 ? (
              <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5">
                {cardColumns.map((column) => (
                  <div key={column.id} className="min-w-0">
                    <dt className="text-[0.65625rem] font-bold uppercase tracking-[0.08em] text-muted">
                      {column.cardLabel}
                    </dt>
                    <dd className="mt-0.5 truncate text-[0.75rem] text-ink-soft">
                      {column.cardCell ? column.cardCell(row) : column.cell(row)}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </li>
        ))}
      </ul>
    </>
  );
}
