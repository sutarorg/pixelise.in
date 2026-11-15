import { requireAdmin } from "@/lib/auth/session";
import { serverEnv } from "@/config/env";
import { apiRoute } from "@/lib/http/route";
import { failures } from "@/lib/http/errors";
import { ok } from "@/lib/http/response";
import { reconcile } from "@/services/reconciliation/reconcile-service";

/**
 * POST /api/v1/admin/reconcile
 *
 * Authorised either by an owner/admin session or by the Vercel cron secret. It
 * looks for three kinds of drift: jobs that stopped moving, payments captured but
 * not credited, and abandoned uploads.
 */

export const POST = apiRoute("admin-reconcile", async ({ request, requestId }) => {
  const authorization = request.headers.get("authorization") ?? "";
  const cronAuthorised = Boolean(serverEnv.cronSecret) && authorization === `Bearer ${serverEnv.cronSecret}`;

  if (!cronAuthorised) {
    await requireAdmin("config:write");
  }

  const url = new URL(request.url);
  const dryRun = url.searchParams.get("dryRun") === "1";

  if (dryRun && !cronAuthorised) {
    // Dry runs are a convenience for the console; keep them owner-only.
    await requireAdmin("config:write");
  }

  try {
    return ok(await reconcile({ dryRun }), requestId);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error) throw error;
    throw failures.unavailable("Reconciliation could not run.");
  }
});
