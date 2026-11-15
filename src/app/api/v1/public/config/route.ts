import { PACKS } from "@/config/packs";
import { defaultsForPublicSite } from "@/lib/public-config";
import { apiRoute } from "@/lib/http/route";
import { ok } from "@/lib/http/response";

/**
 * GET /api/v1/public/config — everything the marketing site needs to be honest
 * about what this deployment can do: its packs, and which integrations are live.
 *
 * No secret is included: the flags simply state whether a provider is configured,
 * so a page can render "not available yet" rather than a broken form.
 */

export const GET = apiRoute("public-config", async ({ requestId }) =>
  ok(
    {
      packs: PACKS.map((pack) => ({
        id: pack.id,
        name: pack.name,
        pricePaise: pack.pricePaise,
        credits: pack.credits,
        currency: pack.currency,
      })),
      capabilities: defaultsForPublicSite(),
    },
    requestId,
  ),
);
