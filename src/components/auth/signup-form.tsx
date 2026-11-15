"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { MailCheck } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FieldError, FieldHint, Input, Label } from "@/components/ui/field";
import { signUp } from "@/lib/api/browser";
import { describeAuthFailure } from "@/lib/auth/error-message";

/**
 * The body of `/signup`. The card and H1 belong to the page.
 *
 * Two outcomes are possible and they are not the same thing:
 *  - `signed_in`            → confirmation is off; go straight in.
 *  - `pending_verification` → a confirmation email was sent; say so, and do not
 *                             imply the studio is already open.
 */

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Field = "displayName" | "email" | "password" | "confirm";
type Errors = Partial<Record<Field | "form", string>>;

export function SignUpForm() {
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [awaitingEmail, setAwaitingEmail] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const next: Errors = {};
    if (!emailPattern.test(email.trim())) next.email = "Enter a valid email address.";
    if (password.length < 8) next.password = "Use at least 8 characters.";
    else if (password.length > 72) next.password = "Use 72 characters or fewer.";
    if (confirmation !== password) next.confirm = "The two passwords do not match.";
    if (displayName.trim().length === 1) {
      next.displayName = "Use at least 2 characters, or leave it blank.";
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    const result = await signUp({
      email: email.trim(),
      password,
      ...(displayName.trim() ? { displayName: displayName.trim() } : {}),
    });
    setSubmitting(false);

    if (!result.ok) {
      setErrors({ form: describeAuthFailure(result.error, "sign-up").message });
      return;
    }

    if (result.data.status === "signed_in") {
      router.replace("/dashboard");
      router.refresh();
      return;
    }

    setAwaitingEmail(true);
  }

  if (awaitingEmail) {
    return (
      <div>
        <h2 className="text-[1.125rem] font-bold tracking-[-0.02em] text-ink">Check your inbox</h2>
        <p className="mt-2 text-[0.875rem] leading-[1.6] text-muted">
          We sent a confirmation link to <span className="font-semibold text-ink">{email.trim()}</span>.
          Open it to finish setting up your account.
        </p>
        <Alert tone="info" title="One click left" className="mt-4">
          The link works once and expires after a short while. If it has not arrived in a few
          minutes, check the spam folder before starting again.
        </Alert>
        <p className="mt-4 flex items-center gap-2 text-[0.8125rem] text-muted-strong">
          <MailCheck className="size-4 text-violet-ink" aria-hidden="true" />
          Nothing is charged until you choose a credit pack.
        </p>
        <Button asChild variant="secondary" size="lg" className="mt-5 w-full">
          <Link href="/login">Back to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
      {errors.form ? (
        <Alert tone="danger" live>
          {errors.form}
        </Alert>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="signup-name">Your name</Label>
        <Input
          id="signup-name"
          name="name"
          type="text"
          autoComplete="name"
          placeholder="Optional"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          aria-invalid={Boolean(errors.displayName)}
          aria-describedby={errors.displayName ? "signup-name-error" : "signup-name-hint"}
        />
        {errors.displayName ? (
          <FieldError id="signup-name-error">{errors.displayName}</FieldError>
        ) : (
          <FieldHint id="signup-name-hint">Used on receipts and in the studio greeting.</FieldHint>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="signup-email">Email address</Label>
        <Input
          id="signup-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="you@store.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "signup-email-error" : undefined}
        />
        {errors.email ? <FieldError id="signup-email-error">{errors.email}</FieldError> : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="signup-password">Password</Label>
        <Input
          id="signup-password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          maxLength={72}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? "signup-password-error" : "signup-password-hint"}
        />
        {errors.password ? (
          <FieldError id="signup-password-error">{errors.password}</FieldError>
        ) : (
          <FieldHint id="signup-password-hint">At least 8 characters.</FieldHint>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="signup-confirm">Repeat the password</Label>
        <Input
          id="signup-confirm"
          name="confirm-password"
          type="password"
          autoComplete="new-password"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          aria-invalid={Boolean(errors.confirm)}
          aria-describedby={errors.confirm ? "signup-confirm-error" : undefined}
        />
        {errors.confirm ? <FieldError id="signup-confirm-error">{errors.confirm}</FieldError> : null}
      </div>

      <Button type="submit" size="lg" disabled={submitting} className="w-full">
        {submitting ? "Creating your account…" : "Create account"}
      </Button>

      <p className="text-[0.75rem] leading-[1.55] text-muted">
        By creating an account you agree to the{" "}
        <Link href="/terms" className="underline decoration-line-strong underline-offset-2 hover:text-ink">
          terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline decoration-line-strong underline-offset-2 hover:text-ink">
          privacy policy
        </Link>
        .
      </p>
    </form>
  );
}
