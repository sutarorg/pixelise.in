import * as React from "react";

import { Eyebrow } from "@/components/shared/eyebrow";
import { MarketingImage } from "@/components/shared/marketing-image";
import { IconCheck } from "@/components/shared/icons";
import type { MarketingImageKey } from "@/config/images";
import { cn } from "@/lib/utils";

export function FeatureRow({
  eyebrow,
  title,
  body,
  bullets,
  imageKey,
  alt,
  reverse = false,
  footer,
  id,
}: {
  eyebrow: string;
  title: string;
  body: React.ReactNode;
  bullets?: readonly string[];
  imageKey: MarketingImageKey;
  alt: string;
  reverse?: boolean;
  footer?: React.ReactNode;
  id?: string;
}) {
  return (
    <div
      id={id}
      className="grid items-center gap-9 lg:grid-cols-2 lg:gap-16 xl:gap-20"
    >
      <div className={cn("relative", reverse && "lg:order-2")}>
        <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
          <MarketingImage
            imageKey={imageKey}
            alt={alt}
            sizes="(max-width: 1023px) 100vw, 48vw"
            fill
          />
        </div>
      </div>

      <div className={cn("max-w-[36rem]", reverse && "lg:order-1")}>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 className="text-h2 mt-4 text-ink">{title}</h2>
        <div className="text-[1rem] leading-[1.7] text-muted-strong">{body}</div>
        {bullets?.length ? (
          <ul className="mt-6 space-y-2.5">
            {bullets.map((bullet) => (
              <li key={bullet} className="flex items-start gap-2.5">
                <IconCheck className="mt-1 size-4 shrink-0 text-violet" />
                <span className="text-[0.9375rem] leading-[1.6] text-muted-strong">
                  {bullet}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
        {footer ? <div className="mt-7">{footer}</div> : null}
      </div>
    </div>
  );
}
