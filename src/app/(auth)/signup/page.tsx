import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard } from "@/components/auth/auth-card";
import { SignUpForm } from "@/components/auth/signup-form";
import { pageMetadata } from "@/lib/seo/metadata";

/** `/signup` — account creation against the existing auth API route. */

export const metadata: Metadata = pageMetadata({
  title: "Create an account",
  description:
    "Create a Pixelise account to buy a one-time credit pack and turn ordinary product photos into studio, lifestyle and advertising visuals.",
  path: "/signup",
  noIndex: true,
});

export default function SignUpPage() {
  return (
    <AuthCard
      title="Create your account"
      description="Free to create. You only pay when you buy a credit pack, and each pack is a one-time purchase."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-violet-ink underline decoration-violet/35 underline-offset-4 hover:decoration-violet"
          >
            Sign in
          </Link>
        </>
      }
    >
      <SignUpForm />
    </AuthCard>
  );
}
