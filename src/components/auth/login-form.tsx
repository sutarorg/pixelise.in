"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowRight } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FieldError, FieldHint, Input, Label } from "@/components/ui/field";
import { signIn, updatePassword } from "@/lib/api/browser";
import { describeAuthFailure } from "@/lib/auth/error-message";

/**
 * The body of `/login`, in either of its two modes:
 *
 *  - `sign-in`  — email + password against `POST /api/v1/auth/sign-in`;
 *  - `recovery` — the customer arrived from a reset email already holding a
 *    session, so this only asks for the new password.
 *
 * The card, the H1 and the cross-links live in the page (server-rendered) so the
 * heading is in the first byte of HTML. This component owns only the fields and
 * their states.
 *
 * Supabase gives the same answer for "wrong password" and "no such account", and
 * the API route preserves that, so nothing here hints at which emails exist.
 */

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Field = "email" | "password" | "confirm";
type Errors = Partial<Record<Field | "form", string>>;
type Pending = "sign-in" | "password" | null;

export function LoginForm({
  mode,
  nextPath,
  linkError = null,
}: {
  mode: "sign-in" | "recovery";
  /** Sanitised by the page: always a same-origin path. */
  nextPath: string;
  /** Message derived from `?error=` when a one-time link could not be exchanged. */
  linkError?: string | null;
}) {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [pending, setPending] = useState<Pending>(null);
  const [passwordUpdated, setPasswordUpdated] = useState(false);

  function goToApp() {
    router.replace(nextPath);
    /* The API response wrote the session cookies; refreshing is what makes the
       server components behind /dashboard read them. */
    router.refresh();
  }

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const next: Errors = {};
    if (!emailPattern.test(email.trim())) next.email = "Enter a valid email address.";
    if (password.length === 0) next.password = "Enter your password.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setPending("sign-in");
    const result = await signIn({ email: email.trim(), password });
    setPending(null);

    if (result.ok) {
      goToApp();
      return;
    }

    setErrors({ form: describeAuthFailure(result.error, "sign-in").message });
  }

  async function handlePasswordUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const next: Errors = {};
    if (password.length < 8) next.password = "Use at least 8 characters.";
    else if (password.length > 72) next.password = "Use 72 characters or fewer.";
    if (confirmation !== password) next.confirm = "The two passwords do not match.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setPending("password");
    const result = await updatePassword({ password });
    setPending(null);

    if (result.ok) {
      setPasswordUpdated(true);
      return;
    }

    setErrors({ form: describeAuthFailure(result.error, "update-password").message });
  }

  if (passwordUpdated) {
    return (
      <div>
        <h2 className="text-[1.125rem] font-bold tracking-[-0.02em] text-ink">
          Password updated
        </h2>
        <p className="mt-2 text-[0.875rem] leading-[1.6] text-muted">
          Your new password is active and you are signed in on this device.
        </p>
        <Alert tone="success" live title="Other devices stay signed in" className="mt-4">
          If you reset the password because someone else had access, sign those devices out and
          change it again.
        </Alert>
        <Button type="button" size="lg" className="mt-5 w-full" onClick={goToApp}>
          Go to your dashboard
          <ArrowRight aria-hidden="true" />
        </Button>
      </div>
    );
  }

  if (mode === "recovery") {
    return (
      <form className="flex flex-col gap-5" onSubmit={handlePasswordUpdate} noValidate>
        {errors.form ? (
          <Alert tone="danger" live>
            {errors.form}
          </Alert>
        ) : null}

        <div className="flex flex-col gap-2">
          <Label htmlFor="recovery-password">New password</Label>
          <Input
            id="recovery-password"
            name="new-password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={72}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={
              errors.password ? "recovery-password-error" : "recovery-password-hint"
            }
          />
          {errors.password ? (
            <FieldError id="recovery-password-error">{errors.password}</FieldError>
          ) : (
            <FieldHint id="recovery-password-hint">At least 8 characters.</FieldHint>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="recovery-confirm">Repeat the password</Label>
          <Input
            id="recovery-confirm"
            name="confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            aria-invalid={Boolean(errors.confirm)}
            aria-describedby={errors.confirm ? "recovery-confirm-error" : undefined}
          />
          {errors.confirm ? (
            <FieldError id="recovery-confirm-error">{errors.confirm}</FieldError>
          ) : null}
        </div>

        <Button type="submit" size="lg" disabled={pending === "password"} className="w-full">
          {pending === "password" ? "Saving…" : "Save new password"}
        </Button>

        <p className="text-center text-[0.75rem] leading-[1.55] text-muted">
          Link expired?{" "}
          <Link
            href="/forgot-password"
            className="font-semibold text-violet-ink underline decoration-violet/35 underline-offset-4 hover:decoration-violet"
          >
            Request a new one
          </Link>
        </p>
      </form>
    );
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSignIn} noValidate>
      {linkError ? (
        <Alert tone="warning" live>
          {linkError}
        </Alert>
      ) : null}

      {errors.form ? (
        <Alert tone="danger" live>
          {errors.form}
        </Alert>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="login-email">Email address</Label>
        <Input
          id="login-email"
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
          aria-describedby={errors.email ? "login-email-error" : undefined}
        />
        {errors.email ? <FieldError id="login-email-error">{errors.email}</FieldError> : null}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-3">
          <Label htmlFor="login-password">Password</Label>
          <Link
            href="/forgot-password"
            className="text-[0.75rem] font-semibold text-violet-ink underline decoration-violet/35 underline-offset-4 hover:decoration-violet"
          >
            Forgot password?
          </Link>
        </div>
        <Input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          maxLength={72}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? "login-password-error" : undefined}
        />
        {errors.password ? (
          <FieldError id="login-password-error">{errors.password}</FieldError>
        ) : null}
      </div>

      <Button type="submit" size="lg" disabled={pending === "sign-in"} className="w-full">
        {pending === "sign-in" ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
