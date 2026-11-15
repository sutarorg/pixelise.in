import { describe, expect, it } from "vitest";

import { PACKS } from "@/config/packs";
import { pricingPacks } from "@/config/pricing";

/**
 * The marketing site renders `pricingPacks`; the checkout charges `PACKS`.
 * They are two views of the same business decision, so this test fails the build
 * if anyone edits one of them alone.
 */
describe("website pricing matches the backend pack table", () => {
  it("lists the same packs, in the same order", () => {
    expect(pricingPacks.map((pack) => pack.id)).toEqual(PACKS.map((pack) => pack.id));
  });

  it("agrees on price and credits", () => {
    for (const pack of PACKS) {
      const published = pricingPacks.find((entry) => entry.id === pack.id);
      expect(published, `marketing copy is missing ${pack.id}`).toBeDefined();
      expect(published!.price * 100).toBe(pack.pricePaise);
      expect(published!.credits).toBe(pack.credits);
      expect(published!.currency).toBe(pack.currency);
      expect(published!.paymentType).toBe(pack.purchaseType);
    }
  });

  it("uses the same one-time framing in both places", () => {
    for (const pack of PACKS) {
      expect(pack.purchaseType).toBe("one-time");
    }
    for (const published of pricingPacks) {
      const copy = published.features.join(" ").toLowerCase();
      expect(copy).toContain("one-time purchase");
      expect(copy).toContain("no subscription");
    }
  });
});
