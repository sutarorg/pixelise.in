import type { SVGProps } from "react";

/**
 * Purpose-drawn line icons for Pixelise. One 24px grid, 1.5 stroke,
 * round caps — used instead of a generic icon set so the feature and
 * process blocks read as one system.
 */

type IconProps = SVGProps<SVGSVGElement>;

function Base({ children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

/** Professional quality — a lens with a controlled highlight. */
export function IconLens(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="11" cy="12" r="7.25" />
      <circle cx="11" cy="12" r="3" />
      <path d="M16.4 6.6 19.6 3.4" opacity="0.5" />
      <path d="M6.2 17.4c-.9.9-1.9 2.1-2.4 3.1" opacity="0.5" />
      <path d="M8.3 8.9a3.6 3.6 0 0 1 2.1-1.1" opacity="0.65" />
    </Base>
  );
}

/** Multiple photography styles — layered frames. */
export function IconLayers(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 3.4 20.4 7.8 12 12.2 3.6 7.8 12 3.4Z" />
      <path d="M3.6 12.1 12 16.5l8.4-4.4" opacity="0.75" />
      <path d="M3.6 16.3 12 20.7l8.4-4.4" opacity="0.4" />
    </Base>
  );
}

/** Fast AI generation — a spark with a smaller echo. */
export function IconSpark(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M10.4 3.2c.9 3.3 1.9 4.3 5.2 5.2-3.3.9-4.3 1.9-5.2 5.2-.9-3.3-1.9-4.3-5.2-5.2 3.3-.9 4.3-1.9 5.2-5.2Z" />
      <path d="M17.2 13.4c.5 1.8 1 2.3 2.8 2.8-1.8.5-2.3 1-2.8 2.8-.5-1.8-1-2.3-2.8-2.8 1.8-.5 2.3-1 2.8-2.8Z" />
      <path d="M6.2 16.6c.3 1 .6 1.3 1.6 1.6-1 .3-1.3.6-1.6 1.6-.3-1-.6-1.3-1.6-1.6 1-.3 1.3-.6 1.6-1.6Z" opacity="0.7" />
    </Base>
  );
}

/** Cost-effective creation — a stack of credits. */
export function IconCredits(props: IconProps) {
  return (
    <Base {...props}>
      <ellipse cx="12" cy="6.6" rx="7.4" ry="3.1" />
      <path d="M4.6 6.6v5c0 1.7 3.3 3.1 7.4 3.1s7.4-1.4 7.4-3.1v-5" />
      <path d="M4.6 11.6v5c0 1.7 3.3 3.1 7.4 3.1s7.4-1.4 7.4-3.1v-5" opacity="0.55" />
    </Base>
  );
}

/** Step 01 — upload. */
export function IconUpload(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 15.5V3.9" />
      <path d="m7.9 8 4.1-4.1L16.1 8" />
      <path d="M4.6 15.2v2.6a2.7 2.7 0 0 0 2.7 2.7h9.4a2.7 2.7 0 0 0 2.7-2.7v-2.6" />
    </Base>
  );
}

/** Step 02 — choose a style. */
export function IconSwatch(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="3.4" y="8.6" width="11.2" height="11.2" rx="2.4" />
      <path d="M9.4 5.2h8.4a2.4 2.4 0 0 1 2.4 2.4v8.4" opacity="0.6" />
      <path d="M6.6 14.2h4.8" opacity="0.55" />
    </Base>
  );
}

/** Step 03 — generate. */
export function IconGenerate(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="3.2" y="3.2" width="8.4" height="8.4" rx="2" />
      <rect x="12.4" y="3.2" width="8.4" height="8.4" rx="2" opacity="0.45" />
      <rect x="3.2" y="12.4" width="8.4" height="8.4" rx="2" opacity="0.45" />
      <path d="M16.6 12.9c.6 2.2 1.3 2.9 3.5 3.5-2.2.6-2.9 1.3-3.5 3.5-.6-2.2-1.3-2.9-3.5-3.5 2.2-.6 2.9-1.3 3.5-3.5Z" />
    </Base>
  );
}

/** Step 04 — download. */
export function IconDownload(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 3.9v11.6" />
      <path d="m16.1 11.4-4.1 4.1-4.1-4.1" />
      <path d="M4.6 15.2v2.6a2.7 2.7 0 0 0 2.7 2.7h9.4a2.7 2.7 0 0 0 2.7-2.7v-2.6" />
    </Base>
  );
}

/** Inline bullet / list check. */
export function IconCheck(props: IconProps) {
  return (
    <Base strokeWidth={1.9} {...props}>
      <path d="m4.8 12.6 4.5 4.4L19.2 7.2" />
    </Base>
  );
}

/** Mark used in the transformation composition. */
export function IconArrowRight(props: IconProps) {
  return (
    <Base strokeWidth={1.75} {...props}>
      <path d="M4.5 12h15" />
      <path d="m14 6.5 5.5 5.5-5.5 5.5" />
    </Base>
  );
}

/**
 * Hand-drawn directional arrow used between the source photo and the
 * rendered result in the hero composition. Intentionally irregular:
 * uneven control points and a two-stroke head.
 */
export function DrawnArrow({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 104 62"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path
        d="M3.2 46.4C13.6 30.2 33.9 18.6 56.8 16.2c13.2-1.4 27.8 1.4 39.4 8.9"
        stroke="currentColor"
        strokeWidth={1.7}
        strokeLinecap="round"
      />
      <path
        d="M84.4 13.4c5.6 3.4 9.9 7.4 13.9 12.6"
        stroke="currentColor"
        strokeWidth={1.7}
        strokeLinecap="round"
      />
      <path
        d="M98.6 31.6c-5.2-1.5-9.6-2.3-15.1-2.4"
        stroke="currentColor"
        strokeWidth={1.7}
        strokeLinecap="round"
      />
      <circle cx="3.4" cy="46.6" r="2" fill="currentColor" />
    </svg>
  );
}
