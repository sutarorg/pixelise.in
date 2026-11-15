import { Plus } from "lucide-react";

import type { FaqItem } from "@/config/content";
import { cn } from "@/lib/utils";

/**
 * FAQ list built on native <details>/<summary>.
 *
 * Deliberate choice: every answer is present in the server-rendered HTML, so
 * search engines and assistive technology always have the full answer text.
 * Closing a panel hides it visually, not from the DOM. It also works with no
 * JavaScript at all, and keyboard/screen-reader behaviour is the browser's.
 */
export function FaqList({
  items,
  className,
  defaultOpen,
}: {
  items: readonly FaqItem[];
  className?: string;
  /** id of the item that starts open. */
  defaultOpen?: string;
}) {
  return (
    <div className={cn("divide-y divide-line", className)}>
      {items.map((item) => (
        <details
          key={item.id}
          id={item.id}
          open={defaultOpen === item.id}
          className="group faq-item"
        >
          <summary className="faq-summary flex cursor-pointer list-none items-start justify-between gap-6 py-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet [&::-webkit-details-marker]:hidden">
            <h3 className="text-[1.0625rem] font-semibold leading-snug tracking-[-0.015em] text-ink transition-colors group-hover:text-violet-ink">
              {item.question}
            </h3>
            <span
              aria-hidden="true"
              className="faq-icon mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border border-line-strong text-muted transition-[transform,color,border-color] duration-200"
            >
              <Plus className="size-3.5" strokeWidth={2} />
            </span>
          </summary>
          <p className="max-w-[62ch] pb-6 pr-10 text-[0.9375rem] leading-[1.7] text-muted-strong">
            {item.answer}
          </p>
        </details>
      ))}
    </div>
  );
}
