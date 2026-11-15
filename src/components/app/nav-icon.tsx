import {
  HelpCircle,
  Home,
  Images,
  ReceiptText,
  Settings,
  Sparkles,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import type { NavItem } from "@/config/dashboard";

const icons: Record<NavItem["icon"], LucideIcon> = {
  home: Home,
  sparkles: Sparkles,
  images: Images,
  wallet: Wallet,
  receipt: ReceiptText,
  settings: Settings,
  help: HelpCircle,
};

export function NavIcon({
  name,
  className,
}: {
  name: NavItem["icon"];
  className?: string;
}) {
  const Icon = icons[name];
  return <Icon className={className} strokeWidth={1.9} aria-hidden="true" />;
}
