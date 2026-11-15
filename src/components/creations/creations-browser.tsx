"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { GenerationCard } from "@/components/creations/generation-card";
import { DeleteCreationButton } from "@/components/creations/delete-creation-button";
import { listGenerations } from "@/lib/api/browser";
import type { Generation } from "@/lib/api/types";

/**
 * Cursor-paginated gallery. The first page is rendered on the server; further
 * pages are appended here, capped so a large library never renders hundreds of
 * images at once. Delete removes a card only after the service confirms.
 */
export function CreationsBrowser({
  initialItems,
  initialCursor,
  style,
  sort,
}: {
  initialItems: Generation[];
  initialCursor: string | null;
  style: string;
  sort: "newest" | "oldest";
}) {
  const [items, setItems] = React.useState(initialItems);
  const [cursor, setCursor] = React.useState(initialCursor);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function loadMore() {
    if (!cursor || loading) return;
    setLoading(true);
    setError(null);
    const result = await listGenerations({ style, sort, cursor, limit: "24" });
    setLoading(false);
    if (!result.ok) {
      setError(
        result.error.code === "not_configured"
          ? "More creations need the Pixelise service, which isn't connected in this environment."
          : result.error.message,
      );
      return;
    }
    setItems((current) => [...current, ...result.data.items]);
    setCursor(result.data.nextCursor);
  }

  return (
    <div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        {items.map((generation, index) => (
          <li key={generation.id}>
            <GenerationCard
              generation={generation}
              priority={index < 4}
              actions={
                <DeleteCreationButton
                  id={generation.id}
                  label={`${generation.styleName} visual${generation.sceneName ? ` — ${generation.sceneName}` : ""}`}
                  onDeleted={() =>
                    setItems((current) => current.filter((item) => item.id !== generation.id))
                  }
                />
              }
            />
          </li>
        ))}
      </ul>

      {error ? (
        <div className="mt-4">
          <Alert tone="danger" live title="We couldn't load more creations">
            {error}
          </Alert>
        </div>
      ) : null}

      {cursor ? (
        <div className="mt-5 flex justify-center">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={loadMore}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : null}
            {loading ? "Loading…" : "Load more creations"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
