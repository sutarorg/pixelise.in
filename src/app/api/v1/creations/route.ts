import { requireUser } from "@/lib/auth/session";
import { apiRoute } from "@/lib/http/route";
import { ok } from "@/lib/http/response";
import { listGenerations } from "@/services/generations/generation-service";

/**
 * GET /api/v1/creations — the customer's gallery.
 *
 * Same rows as `/generations`, named for the page that reads them. Keeping the
 * two nouns as aliases of one query avoids a second definition of "a creation".
 */

export const GET = apiRoute("creations-list", async ({ request, requestId }) => {
  const user = await requireUser();
  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? "12");

  return ok(
    await listGenerations({
      userId: user.id,
      style: url.searchParams.get("style"),
      sort: url.searchParams.get("sort") === "oldest" ? "oldest" : "newest",
      cursor: url.searchParams.get("cursor"),
      limit: Number.isFinite(limit) ? limit : 12,
    }),
    requestId,
  );
});
