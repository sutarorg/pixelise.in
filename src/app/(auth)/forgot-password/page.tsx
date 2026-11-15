import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard } from "@/components/auth/auth-card";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { pageMetadata } from "@/lib/seo/metadata";

/**
 * `/forgot-password` — requests the reset email.
 *
 * The link inside it points at `/api/v1/auth/callback`, which exchanges the
 * one-time code and forwards to `/login?mode=recovery`, so the customer arrives
 * holding a session that can actually save a new password.
 */

export const metadata: Metadata = pageMetadata({
  title: "Reset your password",
  description:
    "Request a password reset link for your Pixelise account. The link works once and expires shortly after it is sent.",
  path: "/forgot-password",
  noIndex: true,
});

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Reset your password"
      description="Enter the address you signed up with and we'll email you a link to choose a new password."
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
      <ForgotPasswordForm />
    </AuthCard>
  );
}
