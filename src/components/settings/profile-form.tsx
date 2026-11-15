"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { FieldHint, Input, Label } from "@/components/ui/field";
import { updateProfile } from "@/lib/api/browser";

export function ProfileForm({
  displayName,
  email,
  emailVerified,
}: {
  displayName: string | null;
  email: string;
  emailVerified: boolean;
}) {
  const router = useRouter();
  const [name, setName] = React.useState(displayName ?? "");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);

  const dirty = name.trim() !== (displayName ?? "");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!dirty || saving) return;
    setSaving(true);
    setError(null);
    setSaved(false);

    const result = await updateProfile({ displayName: name.trim() });
    setSaving(false);

    if (!result.ok) {
      setError(
        result.error.code === "not_configured"
          ? "Saving needs the Pixelise service, which isn't connected in this environment. Nothing was changed."
          : result.error.message,
      );
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="px-4 py-4 sm:px-5" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="display-name">Display name</Label>
          <Input
            id="display-name"
            name="displayName"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setSaved(false);
            }}
            maxLength={60}
            autoComplete="name"
            aria-describedby="display-name-hint"
            className="mt-1.5"
          />
          <FieldHint id="display-name-hint" className="mt-1.5">
            Used to greet you in the workspace. Leave it blank and Pixelise will use a neutral
            greeting instead.
          </FieldHint>
        </div>

        <div>
          <Label htmlFor="account-email">Email</Label>
          <Input
            id="account-email"
            type="email"
            value={email}
            readOnly
            disabled
            aria-describedby="account-email-hint"
            className="mt-1.5"
          />
          <FieldHint id="account-email-hint" className="mt-1.5">
            {emailVerified
              ? "Verified. Changing your email is handled by the account service."
              : "Not verified yet. Verification is handled by the account service."}
          </FieldHint>
        </div>
      </div>

      {error ? (
        <Alert tone="danger" live className="mt-4">
          {error}
        </Alert>
      ) : null}
      {saved ? (
        <Alert tone="success" live className="mt-4">
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="size-3.5" aria-hidden="true" />
            Saved.
          </span>
        </Alert>
      ) : null}

      <div className="mt-4 flex items-center gap-2">
        <Button type="submit" size="md" disabled={!dirty || saving}>
          {saving ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
          {saving ? "Saving…" : "Save changes"}
        </Button>
        {dirty ? (
          <p className="text-[0.75rem] text-muted">Unsaved changes</p>
        ) : null}
      </div>
    </form>
  );
}
