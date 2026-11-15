import { requireAdmin } from "@/lib/auth/session";
import { apiRoute, parseBody } from "@/lib/http/route";
import { ok } from "@/lib/http/response";
import { adminSettingsSchema } from "@/lib/validations";
import { getServiceClient } from "@/lib/supabase/service";
import { updateSystemSetting } from "@/services/admin/admin-service";

/** GET /api/v1/admin/settings — raw key/value platform settings. */
export const GET = apiRoute("admin-settings", async ({ requestId }) => {
  await requireAdmin("audit:read");

  const { data, error } = await getServiceClient().from("system_settings").select("key, value, updated_at");
  if (error) throw new Error("settings_read_failed");

  return ok(data ?? [], requestId);
});

/** PATCH /api/v1/admin/settings — one key at a time, audited as a config change. */
export const PATCH = apiRoute("admin-settings-update", async ({ request, requestId }) => {
  const admin = await requireAdmin("config:write");
  const body = await parseBody(request, adminSettingsSchema);

  await updateSystemSetting({ adminId: admin.id, key: body.key, value: body.value });
  return ok({ key: body.key, updated: true as const }, requestId);
});
