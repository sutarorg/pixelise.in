import * as React from "react";

import { Container } from "@/components/layout/container";
import { Breadcrumbs, type Crumb } from "@/components/shared/breadcrumbs";
import { Eyebrow } from "@/components/shared/eyebrow";

/**
 * Shared hero for inner marketing pages: breadcrumb trail, eyebrow, single H1,
 * supporting copy and an optional action row. Keeps the inner pages in the same
 * type rhythm as the homepage.
 */
export function PageHero({
  eyebrow,
  title,
  lead,
  crumbs,
  actions,
  meta,
  aside,
}: {
  eyebrow: string;
  title: React.ReactNode;
  lead: string;
  crumbs: readonly Crumb[];
  actions?: React.ReactNode;
  meta?: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden border-b border-line">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[26rem] bg-[radial-gradient(70%_100%_at_25%_0%,#F6F3FF_0%,#FCFBFF_55%,#FFFFFF_100%)]"
      />
      <Container className="relative pb-12 pt-6 sm:pb-16 lg:pb-20">
        <Breadcrumbs items={crumbs} />
        <div className="mt-8 grid items-end gap-10 lg:grid-cols-[1.25fr_0.75fr] lg:gap-16">
          <div className="max-w-[46rem]">
            <Eyebrow>{eyebrow}</Eyebrow>
            <h1 className="text-display-sm mt-5 text-ink">{title}</h1>
            <p className="text-lead mt-6 max-w-[38rem] text-muted-strong">{lead}</p>
            {actions ? (
              <div className="mt-8 flex flex-wrap items-center gap-3">{actions}</div>
            ) : null}
            {meta ? <div className="mt-8">{meta}</div> : null}
          </div>
          {aside ? <div className="lg:pb-1">{aside}</div> : null}
        </div>
      </Container>
    </section>
  );
}
