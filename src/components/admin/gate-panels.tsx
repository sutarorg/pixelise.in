import Link from "next/link";
import { ArrowUpRight, Lock, ShieldOff, WifiOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AdminSignOut } from "@/components/admin/admin-sign-out";
import { links } from "@/config/site";

/**
 * Gate surfaces for the console.
 *
 * None of these render a count, a name, a record id or a navigation item: an
 * unauthorized visitor must not learn anything about what the console contains.
 * The 403 in particular is deliberately identical whether the account exists or
 * not.
 */
function GateShell({
  icon: Icon,
  eyebrow,
  title,
  description,
  children,
}: {
  icon: typeof Lock;
  eyebrow: string;
  title: string;
  description: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="grid min-h-dvh place-items-center bg-surface px-4 py-12">
      <div className="w-full max-w-[30rem] rounded-[14px] border border-line bg-white p-6 shadow-card sm:p-7">
        <span
          aria-hidden="true"
          className="grid size-10 place-items-center rounded-[10px] border border-line bg-surface text-muted-strong"
        >
          <Icon className="size-[1.15rem]" strokeWidth={1.9} />
        </span>
        <p className="mt-4 text-[0.65625rem] font-bold uppercase tracking-[0.14em] text-muted">
          {eyebrow}
        </p>
        <h1 className="mt-1.5 text-[1.25rem] font-extrabold leading-[1.25] tracking-[-0.03em] text-ink">
          {title}
        </h1>
        <div className="mt-2 text-[0.84375rem] leading-[1.65] text-muted-strong">{description}</div>
        {children ? <div className="mt-5">{children}</div> : null}
        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-line pt-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded text-[0.75rem] font-semibold text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet"
          >
            Return to pixelise.in
            <ArrowUpRight className="size-3.5" strokeWidth={2} aria-hidden="true" />
          </Link>
          <span className="text-muted/50" aria-hidden="true">
            ·
          </span>
          <AdminSignOut compact />
        </div>
      </div>
    </div>
  );
}

export function ConsoleSignInGate() {
  return (
    <GateShell
      icon={Lock}
      eyebrow="Pixelise Console"
      title="Sign in to continue"
      description="The operations console is only available to signed-in staff accounts. Your session expired, or you opened this URL in a browser that isn't signed in."
    >
      <Button asChild size="sm" variant="primary" className="h-9">
        <Link href={links.login}>Sign in</Link>
      </Button>
    </GateShell>
  );
}

export function ConsoleForbidden() {
  return (
    <GateShell
      icon={ShieldOff}
      eyebrow="403 · Not authorized"
      title="This account can't open the console"
      description="Access is decided by the API on every request. If you believe this is a mistake, ask an owner to review your console role — nothing on this page can be used to request access on your behalf."
    />
  );
}

export function ConsoleUnavailable({ message }: { message?: string }) {
  return (
    <GateShell
      icon={WifiOff}
      eyebrow="Service unavailable"
      title="The console can't reach the API"
      description={
        message ??
        "No administration data could be read, so nothing is shown. No changes were made, and no cached figures are displayed in place of live ones."
      }
    />
  );
}

/**
 * Environment notice, not a modal: in a build without an API base URL the shell
 * still renders so the routes can be reviewed, and every region says plainly that
 * it has no data.
 */
export function ConsoleNotConnectedBanner() {
  return (
    <div className="border-b border-[#f0d9a8] bg-[#fdf6e7] px-4 py-2 sm:px-6 lg:px-8">
      <p className="mx-auto flex max-w-[86rem] flex-wrap items-center gap-x-2 gap-y-1 text-[0.75rem] leading-[1.5] text-[#6a5320]">
        <strong className="font-bold">Not connected.</strong>
        <span>
          This build has no admin API endpoint configured (<code className="font-mono text-[0.71875rem]">PIXELISE_API_BASE_URL</code>),
          so every panel reports “not available” instead of showing placeholder records.
        </span>
      </p>
    </div>
  );
}
