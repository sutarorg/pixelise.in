"use client";

import { useState, type FormEvent } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/field";
import { requestPasswordRecovery } from "@/lib/api/browser";
import { describeAuthFailure } from "@/lib/auth/error-message";

/**
 * The body of `/forgot-password`.
 *
 * The API answers identically whether or not the address exists, so this has one
 * success state and never confirms that an account was found.
 */

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!emailPattern.test(email.trim())) {
      setEmailError("Enter a valid email address.");
      return;
    }

    setEmailError(null);
    setFormError(null);
    setSubmitting(true);
    const result = await requestPasswordRecovery({ email: email.trim() });
    setSubmitting(false);

    if (!result.ok) {
      setFormError(describeAuthFailure(result.error, "recovery").message);
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <div>
        <h2 className="text-[1.125rem] font-bold tracking-[-0.02em] text-ink">Check your inbox</h2>
        <p className="mt-2 text-[0.875rem] leading-[1.6] text-muted">
          If an account exists for{" "}
          <span className="font-semibold text-ink">{email.trim()}</span>, a reset link is on its way.
          It works once and expires shortly after it is sent.
        </p>
        <Alert tone="info" title="Nothing arrived?" className="mt-4">
          Wait a couple of minutes, then check the spam folder. You can request another link below —
          only the newest one works.
        </Alert>
        <Button
          type="button"
          variant="secondary"
          size="lg"
          className="mt-5 w-full"
          onClick={() => setSent(false)}
        >
          Send another link
        </Button>
      </div>
    );
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
      {formError ? (
        <Alert tone="danger" live>
          {formError}
        </Alert>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="recovery-email">Email address</Label>
        <Input
          id="recovery-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="you@store.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={Boolean(emailError)}
          aria-describedby={emailError ? "recovery-email-error" : undefined}
        />
        {emailError ? <FieldError id="recovery-email-error">{emailError}</FieldError> : null}
      </div>

      <Button type="submit" size="lg" disabled={submitting} className="w-full">
        {submitting ? "Sending…" : "Email me a reset link"}
      </Button>
    </form>
  );
}
