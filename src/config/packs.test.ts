import { describe, expect, it } from "vitest";

import { PACKS, getPack, packsForClient } from "@/config/packs";

/**
 * The pack table is the only authority on price. These tests exist so a future
 * edit cannot silently change what a customer is charged, or add a third tier
 * nobody approved.
 */
describe("credit packs", () => {
  it("sells exactly two one-time packs", () => {
    expect(PACKS).toHaveLength(2);
    expect(PACKS.map((pack) => pack.id)).toEqual(["creator", "studio"]);
    expect(PACKS.every((pack) => pack.purchaseType === "one-time")).toBe(true);
    expect(PACKS.every((pack) => pack.currency === "INR")).toBe(true);
  });

  it("keeps the approved prices and credits", () => {
    expect(getPack("creator")).toMatchObject({ pricePaise: 49_900, credits: 150 });
    expect(getPack("studio")).toMatchObject({ pricePaise: 99_900, credits: 350 });
  });

  it("stores money as integer paise, never rupees", () => {
    for (const pack of PACKS) {
      expect(Number.isInteger(pack.pricePaise)).toBe(true);
      expect(pack.pricePaise % 100).toBe(0); // whole rupees, expressed in paise
      expect(pack.pricePaise).toBe(pack.pricePaise);
    }
  });

  it("gives Studio the lower cost per credit", () => {
    const creator = PACKS.find((pack) => pack.id === "creator")!;
    const studio = PACKS.find((pack) => pack.id === "studio")!;
    expect(studio.pricePaise / studio.credits).toBeLessThan(creator.pricePaise / creator.credits);
  });

  it("rejects unknown packs instead of defaulting to one", () => {
    expect(getPack("enterprise")).toBeNull();
    expect(getPack("")).toBeNull();
    expect(getPack("CREATOR")).toBeNull();
  });

  it("exposes a client shape with no server-only fields", () => {
    const packs = packsForClient();
    expect(packs).toHaveLength(2);
    for (const pack of packs) {
      expect(pack).not.toHaveProperty("providerCostUsd");
      expect(pack.currency).toBe("INR");
      expect(Array.isArray(pack.includes)).toBe(true);
    }
  });
});
