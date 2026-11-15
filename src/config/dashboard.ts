/**
 * Customer application structure: navigation, page titles and the small set of
 * labels shared by the shell. Routes here are the only app routes that exist;
 * `docs/route-map.md` records why nothing else was added.
 */

export type NavItem = {
  label: string;
  href: string;
  /** Lucide icon name resolved by the shell. */
  icon: "home" | "sparkles" | "images" | "wallet" | "receipt" | "settings" | "help";
  /** Short description used by the mobile sheet and the help page. */
  description: string;
};

export const workspaceNav: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: "home",
    description: "Your balance, recent creations and next step.",
  },
  {
    label: "AI Studio",
    href: "/studio",
    icon: "sparkles",
    description: "Upload one product photo and create a new scene.",
  },
  {
    label: "My Creations",
    href: "/creations",
    icon: "images",
    description: "Every visual you have generated.",
  },
];

export const accountNav: NavItem[] = [
  {
    label: "Buy Credits",
    href: "/credits",
    icon: "wallet",
    description: "One-time credit packs. No subscription.",
  },
  {
    label: "Transactions",
    href: "/transactions",
    icon: "receipt",
    description: "Credit movements and payments.",
  },
  {
    label: "Settings",
    href: "/settings",
    icon: "settings",
    description: "Profile, security and preferences.",
  },
  {
    label: "Help & Support",
    href: "/help",
    icon: "help",
    description: "Answers, contact and service status.",
  },
];

export const allNav = [...workspaceNav, ...accountNav];

/** Bottom bar on phones: four destinations, the rest live in the account sheet. */
export const mobileNav = [
  workspaceNav[0],
  workspaceNav[1],
  workspaceNav[2],
  accountNav[0],
] as NavItem[];

/** Primary destinations shown in the account sheet on phones. */
export const mobileSheetNav = [accountNav[1], accountNav[2], accountNav[3]] as NavItem[];

export const appMeta = {
  title: "Pixelise Studio",
  /** Shown when the account has no display name. */
  fallbackAccountName: "Your account",
  /** Copy used by the session gate. */
  signInLabel: "Sign in",
} as const;
