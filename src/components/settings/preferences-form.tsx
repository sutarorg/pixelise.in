"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { RetryButton } from "@/components/app/retry-button";
import { updatePreferences } from "@/lib/api/browser";
import type { NotificationPreferences } from "@/lib/api/types";

type PreferenceKey = keyof NotificationPreferences;

const rows: {
  key: PreferenceKey;
  label: string;
  description: string;
}[] = [
  {
    key: "generationComplete",
    label: "Generation finished",
    description: "A short email when a visual finishes rendering, including a link to download it.",
  },
  {
    key: "creditReceipts",
    label: "Credit receipts",
    description: "A receipt for every purchase, and a note when credits are refunded.",
  },
  {
    key: "productUpdates",
    label: "New styles and scenes",
    description: "Occasional notes when the studio gains a new photography style or scene family.",
  },
];

/**
 * Preferences save one key at a time and only flip after the service agrees.
 * A failed save leaves the switch exactly where it was and explains why.
 */
export function PreferencesForm({
  preferences,
  unavailable,
}: {
  preferences: NotificationPreferences | null;
  unavailable: boolean;
}) {
  const [values, setValues] = React.useState<NotificationPreferences | null>(preferences);
  const [savingKey, setSavingKey] = React.useState<PreferenceKey | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [savedKey, setSavedKey] = React.useState<PreferenceKey | null>(null);

  if (!values) {
    return (
      <div className="px-4 py-4 sm:px-5">
        <Alert
          tone="offline"
          title="Preferences are unavailable"
          action={<RetryButton label="Reload" />}
        >
          {unavailable
            ? "Notification preferences load from the Pixelise service, which isn't connected in this environment. Nothing is switched on or off by default."
            : "We couldn't load your preferences. They are unchanged."}
        </Alert>
      </div>
    );
  }

  async function toggle(key: PreferenceKey, next: boolean) {
    if (!values || savingKey) return;
    setSavingKey(key);
    setError(null);
    setSavedKey(null);

    const result = await updatePreferences({ [key]: next });
    setSavingKey(null);

    if (!result.ok) {
      setError(
        result.error.code === "not_configured"
          ? "Saving a preference needs the Pixelise service, which isn't connected in this environment. Nothing was changed."
          : result.error.message,
      );
      return;
    }
    setValues(result.data);
    setSavedKey(key);
  }

  return (
    <div className="divide-y divide-line">
      {rows.map((row) => {
        const checked = values[row.key];
        const busy = savingKey === row.key;
        return (
          <div key={row.key} className="flex items-start justify-between gap-4 px-4 py-3.5 sm:px-5">
            <div className="min-w-0">
              <p id={`pref-${row.key}`} className="text-[0.875rem] font-semibold text-ink">
                {row.label}
              </p>
              <p id={`pref-${row.key}-desc`} className="mt-1 max-w-[54ch] text-[0.75rem] leading-[1.6] text-muted-strong">
                {row.description}
              </p>
              {savedKey === row.key ? (
                <p className="mt-1 text-[0.6875rem] font-semibold text-success" role="status">
                  Saved
                </p>
              ) : null}
            </div>
            <div className="mt-0.5 flex shrink-0 items-center gap-2">
              {busy ? (
                <Loader2 className="size-3.5 animate-spin text-muted" aria-hidden="true" />
              ) : null}
              <Switch
                checked={checked}
                busy={busy}
                onCheckedChange={(next) => void toggle(row.key, next)}
                labelledBy={`pref-${row.key}`}
                describedBy={`pref-${row.key}-desc`}
              />
            </div>
          </div>
        );
      })}

      {error ? (
        <div className="px-4 py-3 sm:px-5">
          <Alert tone="danger" live>
            {error}
          </Alert>
        </div>
      ) : null}
    </div>
  );
}
