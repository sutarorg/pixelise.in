import { formatDate } from "@/lib/format";
import type { AdminVolumePoint } from "@/lib/api/admin-types";
import { cn } from "@/lib/utils";

/**
 * Generation volume over the selected period — drawn only from the aggregated
 * points the API returned.
 *
 * The bars are decorative duplicates of numbers that are also available as text:
 * the totals sit above the chart, and the exact per-day figures are in a real
 * `<table>` behind "Daily figures". No axis is invented, no point is interpolated,
 * and an empty array renders an honest empty state rather than a flat line.
 */
export function VolumeChart({ points }: { points: AdminVolumePoint[] }) {
  if (points.length === 0) {
    return (
      <div className="px-4 py-8 text-center sm:px-5">
        <p className="text-[0.8125rem] font-semibold text-ink">No daily volume to plot</p>
        <p className="mx-auto mt-1 max-w-[54ch] text-[0.75rem] leading-[1.6] text-muted">
          The API returned no aggregation points for this period. That is a real zero — no
          placeholder series is drawn in its place.
        </p>
      </div>
    );
  }

  const peak = Math.max(...points.map((point) => point.total), 1);
  const total = points.reduce((sum, point) => sum + point.total, 0);
  const failed = points.reduce((sum, point) => sum + point.failed, 0);
  const shown = points.slice(-60);
  const trimmed = points.length > shown.length;

  return (
    <div className="px-4 py-4 sm:px-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <dl className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
          <div className="flex items-baseline gap-1.5">
            <dt className="text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-muted">
              Total
            </dt>
            <dd className="text-[1.125rem] font-extrabold tabular-nums text-ink">
              {total.toLocaleString("en-IN")}
            </dd>
          </div>
          <div className="flex items-baseline gap-1.5">
            <dt className="text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-muted">
              Failed
            </dt>
            <dd className="text-[1.125rem] font-extrabold tabular-nums text-ink">
              {failed.toLocaleString("en-IN")}
            </dd>
          </div>
          <div className="flex items-baseline gap-1.5">
            <dt className="text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-muted">
              Peak day
            </dt>
            <dd className="text-[0.8125rem] font-bold tabular-nums text-ink-soft">
              {peak.toLocaleString("en-IN")}
            </dd>
          </div>
        </dl>
        <p className="text-[0.6875rem] text-muted">
          {trimmed ? `Last ${shown.length} of ${points.length} days` : `${points.length} days`}
          {" · "}
          each bar is one API aggregation point
        </p>
      </div>

      <div
        aria-hidden="true"
        className="mt-4 flex h-[8.5rem] items-end gap-[2px] border-b border-line pb-px"
      >
        {shown.map((point) => {
          const height = Math.max(2, Math.round((point.total / peak) * 100));
          const failedHeight = point.total > 0 ? Math.round((point.failed / point.total) * 100) : 0;
          return (
            <div
              key={point.date}
              className="group relative flex h-full min-w-[2px] flex-1 items-end"
            >
              <div
                className="w-full rounded-t-[2px] bg-violet/75"
                style={{ height: `${height}%` }}
              >
                {failedHeight > 0 ? (
                  <div
                    className={cn("mt-auto w-full rounded-t-[2px] bg-[#c4342a]")}
                    style={{ height: `${failedHeight}%` }}
                  />
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-1.5 flex justify-between text-[0.65625rem] text-muted">
        <span>{formatDate(shown[0]!.date)}</span>
        <span>{formatDate(shown[shown.length - 1]!.date)}</span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-[0.65625rem] text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="size-2 rounded-[1px] bg-violet/75" />
          Generations
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="size-2 rounded-[1px] bg-[#c4342a]" />
          Of which failed
        </span>
      </div>

      <details className="mt-3 border-t border-line pt-2.5">
        <summary className="w-fit cursor-pointer list-none text-[0.71875rem] font-semibold text-muted underline decoration-line-strong underline-offset-4 hover:text-ink-soft">
          Daily figures
        </summary>
        <div className="mt-2 max-h-64 overflow-y-auto">
          <table className="w-full border-collapse text-left">
            <caption className="sr-only">Daily generation totals for the selected period</caption>
            <thead>
              <tr className="border-b border-line">
                <th scope="col" className="py-1 pr-3 text-[0.65625rem] font-bold uppercase tracking-[0.1em] text-muted">
                  Date
                </th>
                <th scope="col" className="py-1 pr-3 text-right text-[0.65625rem] font-bold uppercase tracking-[0.1em] text-muted">
                  Total
                </th>
                <th scope="col" className="py-1 text-right text-[0.65625rem] font-bold uppercase tracking-[0.1em] text-muted">
                  Failed
                </th>
              </tr>
            </thead>
            <tbody>
              {points.map((point) => (
                <tr key={point.date} className="border-b border-line/60 last:border-0">
                  <th scope="row" className="py-1 pr-3 text-[0.75rem] font-normal text-ink-soft">
                    {formatDate(point.date)}
                  </th>
                  <td className="py-1 pr-3 text-right text-[0.75rem] tabular-nums text-ink-soft">
                    {point.total.toLocaleString("en-IN")}
                  </td>
                  <td className="py-1 text-right text-[0.75rem] tabular-nums text-ink-soft">
                    {point.failed.toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
