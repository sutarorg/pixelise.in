import { describe, expect, it } from "vitest";

import { mapTransaction } from "@/services/credits/credit-service";

/**
 * Ledger translation.
 *
 * The SQL functions own the balances; this test protects the *meaning* the API
 * gives each row, because the three frontends render these numbers verbatim.
 */

const base = {
  id: "4d1a2b3c-0000-4000-8000-000000000001",
  balance_after: 150,
  reserved_after: 0,
  reference_type: null,
  reference_id: null,
  created_at: "2026-11-01T09:00:00.000Z",
};

describe("ledger rows → API transactions", () => {
  it("maps a purchase with the amount that was actually paid", () => {
    const row = mapTransaction({
      ...base,
      transaction_type: "purchase",
      credit_delta: 150,
      reference_type: "payment",
      reference_id: "4d1a2b3c-0000-4000-8000-0000000000aa",
      description: "Creator pack purchase",
      metadata: { amountPaise: 49900 },
    });

    expect(row.type).toBe("purchase");
    expect(row.credits).toBe(150);
    expect(row.amountPaise).toBe(49900);
    expect(row.currency).toBe("INR");
    expect(row.generationId).toBeNull();
    expect(row.status).toBe("completed");
  });

  it("shows a reservation as a generation charge", () => {
    const row = mapTransaction({
      ...base,
      transaction_type: "reservation",
      credit_delta: -12,
      reference_type: "generation",
      reference_id: "4d1a2b3c-0000-4000-8000-0000000000bb",
      description: "Credits held for a generation",
      metadata: { kind: "hold" },
    });

    expect(row.type).toBe("generation");
    expect(row.credits).toBe(-12);
    expect(row.generationId).toBe("4d1a2b3c-0000-4000-8000-0000000000bb");
    expect(row.amountPaise).toBeNull();
  });

  it("reports the settled amount on a consumption row, whose own delta is zero", () => {
    const row = mapTransaction({
      ...base,
      transaction_type: "consumption",
      credit_delta: 0,
      reference_type: "generation",
      reference_id: "4d1a2b3c-0000-4000-8000-0000000000cc",
      description: "Generation completed — held credits used",
      metadata: { kind: "settles_reservation", credits: 12 },
    });

    expect(row.type).toBe("generation");
    expect(row.credits).toBe(-12);
  });

  it("returns a refund as a positive credit", () => {
    const row = mapTransaction({
      ...base,
      transaction_type: "refund",
      credit_delta: 12,
      reference_type: "generation",
      reference_id: "4d1a2b3c-0000-4000-8000-0000000000dd",
      description: "Generation did not complete — credits returned",
      metadata: { kind: "hold_released" },
    });

    expect(row.type).toBe("refund");
    expect(row.credits).toBe(12);
  });

  it("maps an admin adjustment to the customer-facing type", () => {
    const row = mapTransaction({
      ...base,
      transaction_type: "admin_adjustment",
      credit_delta: -5,
      description: "Admin credit adjustment",
      metadata: { reason: "Duplicate grant corrected after review" },
    });

    expect(row.type).toBe("adjustment");
    expect(row.credits).toBe(-5);
  });

  it("never invents an amount for a row that was not a payment", () => {
    const row = mapTransaction({
      ...base,
      transaction_type: "refund",
      credit_delta: 3,
      description: "Refund",
      metadata: null,
    });

    expect(row.amountPaise).toBeNull();
    expect(row.currency).toBeNull();
  });
});
