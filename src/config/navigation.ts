import { routes } from "@/config/site";

export type NavLink = {
  label: string;
  href: string;
  description?: string;
};

export type NavItem = NavLink & {
  children?: NavLink[];
};

/** Primary navigation. Kept flat and short — five destinations, one disclosure. */
export const primaryNav: readonly NavItem[] = [
  { label: "Features", href: routes.features },
  { label: "Examples", href: routes.examples },
  { label: "Pricing", href: routes.pricing },
  {
    label: "Resources",
    href: routes.faq,
    children: [
      {
        label: "FAQ",
        href: routes.faq,
        description: "How credits, styles and packs work.",
      },
      {
        label: "Contact support",
        href: routes.contact,
        description: "Ask about a pack, an image or your account.",
      },
      {
        label: "Refund policy",
        href: routes.refund,
        description: "What applies to credit purchases.",
      },
    ],
  },
  { label: "How it works", href: routes.howItWorks },
];

export const footerNav: readonly { title: string; links: readonly NavLink[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Features", href: routes.features },
      { label: "Photography styles", href: `${routes.features}#photography-styles` },
      { label: "How it works", href: routes.howItWorks },
      { label: "Examples", href: routes.examples },
    ],
  },
  {
    title: "Plans & pricing",
    links: [
      { label: "Pricing", href: routes.pricing },
      { label: "Creator pack — ₹499", href: `${routes.pricing}#creator` },
      { label: "Studio pack — ₹999", href: `${routes.pricing}#studio` },
      { label: "Get started", href: routes.getStarted },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "FAQ", href: routes.faq },
      { label: "Contact support", href: routes.contact },
      { label: "Log in", href: routes.getStarted },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy policy", href: routes.privacy },
      { label: "Terms of service", href: routes.terms },
      { label: "Refund policy", href: routes.refund },
    ],
  },
] as const;
