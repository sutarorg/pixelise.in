import { Container } from "@/components/layout/container";
import { audienceCategories } from "@/config/content";

/**
 * Editorial audience strip. Deliberately not a logo wall: no partner claims,
 * no invented customer counts.
 */
export function AudienceStrip() {
  return (
    <div className="border-y border-line bg-canvas">
      <Container>
        <div className="flex flex-col items-center gap-5 py-7 text-center lg:flex-row lg:justify-between lg:gap-10 lg:py-8 lg:text-left">
          <p className="text-eyebrow text-muted">
            Made for modern ecommerce businesses
          </p>
          <ul className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 sm:gap-x-4">
            {audienceCategories.map((category, index) => (
              <li
                key={category}
                className="flex items-center gap-3 text-[0.875rem] font-semibold tracking-[-0.01em] text-ink-soft sm:gap-4"
              >
                {index > 0 ? (
                  <span
                    aria-hidden="true"
                    className="size-1 rounded-full bg-violet/45"
                  />
                ) : null}
                {category}
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </div>
  );
}
