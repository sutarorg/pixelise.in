import * as React from "react";
import { AlertTriangle, CheckCircle2, Info, WifiOff } from "lucide-react";

import { cn } from "@/lib/utils";

type AlertTone = "info" | "warning" | "danger" | "success" | "offline";

const tones: Record<
  AlertTone,
  { wrapper: string; icon: string; Icon: typeof Info }
> = {
  info: {
    wrapper: "border-violet/15 bg-tint text-ink-soft",
    icon: "text-violet-ink",
    Icon: Info,
  },
  warning: {
    wrapper: "border-[#f0d9a8] bg-[#fdf6e7] text-[#6a5320]",
    icon: "text-[#a9791a]",
    Icon: AlertTriangle,
  },
  danger: {
    wrapper: "border-[#f3c9c4] bg-[#fdf1f0] text-[#7d2a22]",
    icon: "text-[#c4342a]",
    Icon: AlertTriangle,
  },
  success: {
    wrapper: "border-[#bfe6d2] bg-[#eefaf3] text-[#0d6b46]",
    icon: "text-success",
    Icon: CheckCircle2,
  },
  offline: {
    wrapper: "border-line-strong bg-surface text-muted-strong",
    icon: "text-muted",
    Icon: WifiOff,
  },
};

export interface AlertProps extends Omit<React.ComponentProps<"div">, "title"> {
  tone?: AlertTone;
  title?: string;
  /** Action rendered under the copy — a retry button, a link, etc. */
  action?: React.ReactNode;
  /** Announce the alert when it appears mid-interaction. */
  live?: boolean;
}

export function Alert({
  tone = "info",
  title,
  action,
  live = false,
  className,
  children,
  ...props
}: AlertProps) {
  const { wrapper, icon, Icon } = tones[tone];
  return (
    <div
      role={live ? "status" : undefined}
      aria-live={live ? "polite" : undefined}
      className={cn(
        "flex gap-3 rounded-[12px] border px-3.5 py-3 text-[0.8125rem] leading-[1.55]",
        wrapper,
        className,
      )}
      {...props}
    >
      <Icon className={cn("mt-px size-[1.05rem] shrink-0", icon)} strokeWidth={2} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        {title ? <p className="font-semibold text-ink">{title}</p> : null}
        {children ? <div className={cn(title && "mt-0.5", "min-w-0")}>{children}</div> : null}
        {action ? <div className="mt-2.5 flex flex-wrap items-center gap-2">{action}</div> : null}
      </div>
    </div>
  );
}
