import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";
import { safeNextPath } from "@/lib/auth/next-path";
import { pageMetadata } from "@/lib/seo/metadata";

/**
 * `/login` — the sign-in door, and the landing page for a reset link.
 *
 * `mode`, `next` and `error` are read here on the server so the heading and the
 * cross-links are in the first byte of HTML: a customer who follows a reset link
 * must see "Set a new password", not a sign-in form that swaps under them.
 */

/**
 * `searchParams` decides which heading this page shows, so the route must render
 * per request. Next 16 refuses to prerender that by default (it would block the
 * first paint); declaring the route blocking is the honest choice here — the page
 * is a few kilobytes and a reset link that renders the wrong heading is worse than
 * a few milliseconds of server time.
 */
export const instant = false;

export const metadata: Metadata = pageMetadata({
  title: "Sign in",
  description:
    "Sign in to Pixelise to open your studio, check your credit balance and download the visuals you have already created.",
  path: "/login",
  noIndex: true,
});

/** Codes the auth callback appends when a one-time link cannot be exchanged. */
const linkProblems: Record<string, string> = {
  missing_code:
    "That link arrived without its one-time code, so nothing was changed. Open the newest link from your inbox.",
  link_expired: "That link has expired or was already used. Request a new one and open it right away.",
  unavailable: "We couldn't complete that link just now. Try opening it again, or start over below.",
};

function single(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const recovery = single(params.mode) === "recovery";
  const nextPath = safeNextPath(single(params.next));
  const linkError = linkProblems[single(params.error) ?? ""] ?? null;

  if (recovery) {
    return (
      <AuthCard
        title="Set a new password"
        description="Choose a password for your Pixelise account. You will stay signed in on this device."
        footer={
          <>
            Remembered it?{" "}
            <Link
              href="/login"
              className="font-semibold text-violet-ink underline decoration-violet/35 underline-offset-4 hover:decoration-violet"
            >
              Back to sign in
            </Link>
          </>
        }
      >
        <LoginForm mode="recovery" nextPath={nextPath} />
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Sign in"
      description="Your studio, credits and finished visuals live behind this door."
      footer={
        <>
          New to Pixelise?{" "}
          <Link
            href="/signup"
            className="font-semibold text-violet-ink underline decoration-violet/35 underline-offset-4 hover:decoration-violet"
          >
            Create an account
          </Link>
        </>
      }
    >
      <LoginForm mode="sign-in" nextPath={nextPath} linkError={linkError} />
    </AuthCard>
  );
}
