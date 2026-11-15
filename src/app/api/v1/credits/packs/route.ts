import { packsForClient } from "@/config/packs";
import { apiRoute } from "@/lib/http/route";
import { ok } from "@/lib/http/response";

/**
 * GET /api/v1/credits/packs — the canonical pack table.
 *
 * Prices are business facts from `src/config/packs.ts`, so this endpoint is
 * static and cacheable. The browser renders these numbers; it never calculates
 * them, and the order endpoint independently re-reads the same table.

 */

export const GET = apiRoute("packs", async ({ requestId }) => ok(packsForClient(), requestId));
