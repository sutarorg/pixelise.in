import { describe, expect, it } from "vitest";

import {
  contactSchema,
  createGenerationSchema,
  createOrderSchema,
  createUploadSchema,
  verifyPaymentSchema,
} from "@/lib/validations";

describe("createOrderSchema", () => {
  it("accepts the two approved packs", () => {
    expect(createOrderSchema.safeParse({ packId: "creator" }).success).toBe(true);
    expect(createOrderSchema.safeParse({ packId: "studio" }).success).toBe(true);
  });

  it("rejects an unknown pack and any client-supplied amount", () => {
    expect(createOrderSchema.safeParse({ packId: "enterprise" }).success).toBe(false);
    expect(createOrderSchema.safeParse({ packId: "creator", amountPaise: 1 }).success).toBe(true);

    // Extra keys are stripped, so a browser cannot smuggle an amount into a handler
    // that forgot to ignore it.
    const parsed = createOrderSchema.parse({ packId: "creator", amountPaise: 1 });
    expect(parsed).toEqual({ packId: "creator" });
  });
});

describe("createGenerationSchema", () => {
  const base = { styleId: "studio", sceneId: "minimal-white-studio", qualityId: "standard", aspectRatioId: "1:1" };

  it("accepts the studio's existing field names", () => {
    const parsed = createGenerationSchema.parse({ ...base, assetId: "6f0f7a9e-3a1f-4f0e-9c1b-2b3c4d5e6f70" });
    expect(parsed.sourceAssetId).toBe("6f0f7a9e-3a1f-4f0e-9c1b-2b3c4d5e6f70");
    expect(parsed.aspectRatio).toBe("1:1");
  });

  it("accepts the canonical field names too", () => {
    const parsed = createGenerationSchema.parse({
      ...base,
      aspectRatioId: undefined,
      aspectRatio: "4:5",
      sourceAssetId: "6f0f7a9e-3a1f-4f0e-9c1b-2b3c4d5e6f70",
    });
    expect(parsed.aspectRatio).toBe("4:5");
  });

  it("requires an asset and a known aspect ratio", () => {
    expect(createGenerationSchema.safeParse(base).success).toBe(false);
    const badRatio = createGenerationSchema.safeParse({
      ...base,
      assetId: "6f0f7a9e-3a1f-4f0e-9c1b-2b3c4d5e6f70",
      aspectRatioId: "21:9",
    });
    expect(badRatio.success).toBe(false);
  });

  it("does not accept a credit cost, a model or a price from the client", () => {
    const parsed = createGenerationSchema.parse({
      ...base,
      assetId: "6f0f7a9e-3a1f-4f0e-9c1b-2b3c4d5e6f70",
      creditCost: 1,
      modelEndpoint: "fal-ai/anything",
    });
    expect(parsed).not.toHaveProperty("creditCost");
    expect(parsed).not.toHaveProperty("modelEndpoint");
  });
});

describe("upload and payment schemas", () => {
  it("only allows the three image types and the 20 MB ceiling", () => {
    expect(createUploadSchema.safeParse({ filename: "a.jpg", mimeType: "image/jpeg", bytes: 1024 }).success).toBe(true);
    expect(createUploadSchema.safeParse({ filename: "a.gif", mimeType: "image/gif", bytes: 1024 }).success).toBe(false);
    expect(
      createUploadSchema.safeParse({ filename: "a.jpg", mimeType: "image/jpeg", bytes: 21 * 1024 * 1024 }).success,
    ).toBe(false);
  });

  it("requires all three checkout fields", () => {
    expect(verifyPaymentSchema.safeParse({ orderId: "order_x1", paymentId: "pay_x1", signature: "abc" }).success).toBe(
      false,
    );
    expect(
      verifyPaymentSchema.safeParse({
        orderId: "order_x1",
        paymentId: "pay_x1",
        signature: "a".repeat(64),
      }).success,
    ).toBe(true);
  });
});

describe("contactSchema", () => {
  const valid = {
    name: "Asha Rao",
    email: "Asha@Example.com",
    topic: "billing-and-credits",
    message: "I bought the Studio pack but my credits are not showing yet.",
  };

  it("normalises the email and accepts a complete message", () => {
    const parsed = contactSchema.parse(valid);
    expect(parsed.email).toBe("asha@example.com");
  });

  it("enforces the same limits the form uses", () => {
    expect(contactSchema.safeParse({ ...valid, name: "A" }).success).toBe(false);
    expect(contactSchema.safeParse({ ...valid, message: "too short" }).success).toBe(false);
    expect(contactSchema.safeParse({ ...valid, topic: "sales" }).success).toBe(false);
  });
});
