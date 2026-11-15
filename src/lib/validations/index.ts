import { z } from "zod";

import { PACKS } from "@/config/packs";
import {
  defaultAspectRatios,
  defaultQualities,
  defaultScenes,
  defaultStyles,
  uploadConstraints,
} from "@/config/studio";
import { contactLimits, contactTopics } from "@/lib/contact/contract";

/**
 * Request schemas for the public API.
 *
 * The same rules the studio UI applies are enforced here — and these are the only
 * rules that matter. A request may name a pack id, a style id, a quality id or an
 * aspect ratio id; it may never name a price, a credit cost, a model, a user or a
 * provider request. Those are resolved server-side from configuration tables.
 */

const styleIds = defaultStyles.map((style) => style.id) as [string, ...string[]];
const sceneIds = defaultScenes.map((scene) => scene.id) as [string, ...string[]];
const qualityIds = defaultQualities.map((quality) => quality.id) as [string, ...string[]];
const aspectIds = defaultAspectRatios.map((ratio) => ratio.id) as [string, ...string[]];
const packIds = PACKS.map((pack) => pack.id) as [string, ...string[]];

export const uuidSchema = z.string().uuid("That identifier is not valid.");

export const updateProfileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, "Use at least 2 characters.")
    .max(80, "Use 80 characters or fewer.")
    .optional(),
});

/** Settings toggles are sent flat, matching `NotificationPreferences`. */
export const updatePreferencesSchema = z
  .object({
    generationComplete: z.boolean().optional(),
    creditReceipts: z.boolean().optional(),
    productUpdates: z.boolean().optional(),
  })
  .refine((value) => Object.values(value).some((item) => item !== undefined), {
    message: "Nothing to update.",
  });

/** Account deletion requires an explicit typed confirmation. */
export const deleteAccountSchema = z.object({
  confirmation: z.string().trim().min(1, "Type DELETE to confirm."),
});

/**
 * The studio sends `{ filename, mimeType, bytes }` (see `CreateUploadInput`).
 * The name and size are hints for the ticket; the authoritative size is the
 * object's real length, checked after the upload.
 */
export const createUploadSchema = z.object({
  filename: z.string().trim().min(1).max(200),
  mimeType: z.enum(uploadConstraints.acceptedMimeTypes, {
    message: "Upload a JPG, PNG or WebP image.",
  }),
  bytes: z
    .number()
    .int()
    .positive()
    .max(uploadConstraints.maxBytes, "Images must be 20 MB or smaller."),
});

/**
 * Accepts the existing studio contract (`assetId`, `aspectRatioId`) and the
 * canonical names (`sourceAssetId`, `aspectRatio`) so neither the reviewed
 * frontend nor the API docs have to lie about the other.
 */
export const createGenerationSchema = z
  .object({
    assetId: uuidSchema.optional(),
    sourceAssetId: uuidSchema.optional(),
    styleId: z.enum(styleIds, { message: "Choose a photography style." }),
    sceneId: z.enum(sceneIds, { message: "Choose a scene." }).nullish(),
    qualityId: z.enum(qualityIds, { message: "Choose an output quality." }),
    aspectRatioId: z.enum(aspectIds, { message: "Choose an aspect ratio." }).optional(),
    aspectRatio: z.enum(aspectIds, { message: "Choose an aspect ratio." }).optional(),
    idempotencyKey: z.string().trim().min(8).max(120).optional(),
  })
  .transform((value, ctx) => {
    const sourceAssetId = value.sourceAssetId ?? value.assetId;
    const aspectRatio = value.aspectRatio ?? value.aspectRatioId;

    if (!sourceAssetId) {
      ctx.addIssue({ code: "custom", path: ["assetId"], message: "Upload an image first." });
    }
    if (!aspectRatio) {
      ctx.addIssue({ code: "custom", path: ["aspectRatioId"], message: "Choose an aspect ratio." });
    }

    return { sourceAssetId: sourceAssetId ?? "", aspectRatio: aspectRatio ?? "", styleId: value.styleId, sceneId: value.sceneId ?? null, qualityId: value.qualityId, idempotencyKey: value.idempotencyKey };
  });

export const createOrderSchema = z.object({
  packId: z.enum(packIds, { message: "Choose a credit pack." }),
});

/** Checkout callback body, exactly as the browser sends it (`PaymentVerificationInput`). */
export const verifyPaymentSchema = z.object({
  orderId: z.string().trim().min(6).max(120),
  paymentId: z.string().trim().min(6).max(120),
  signature: z.string().trim().min(16).max(512),
});

export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(contactLimits.name.min, `Use at least ${contactLimits.name.min} characters.`)
    .max(contactLimits.name.max, `Use ${contactLimits.name.max} characters or fewer.`),
  email: z.string().trim().toLowerCase().email("Enter a valid email address.").max(254),
  topic: z.enum([...contactTopics] as [string, ...string[]], { message: "Choose a topic." }),
  message: z
    .string()
    .trim()
    .min(contactLimits.message.min, `Tell us a little more (${contactLimits.message.min}+ characters).`)
    .max(contactLimits.message.max, `Use ${contactLimits.message.max} characters or fewer.`),
  sourcePath: z.string().trim().max(200).optional(),
  /** Honeypot: a real customer never fills this. */
  website: z.string().max(0).optional(),
});

export const listQuerySchema = z.object({
  cursor: z.string().max(80).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
  status: z.string().max(40).optional(),
  style: z.string().max(40).optional(),
  sort: z.enum(["newest", "oldest"]).optional(),
});

export const adminPeriodSchema = z.object({
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
});

export const adminUserStatusSchema = z.object({
  status: z.enum(["active", "suspended"]),
  reason: z.string().trim().min(10, "Give a reason of at least 10 characters.").max(500),
});

export const adminCreditAdjustSchema = z.object({
  userId: uuidSchema,
  direction: z.enum(["credit", "debit"]),
  credits: z.number().int().min(1).max(100000),
  reason: z.string().trim().min(10, "Give a reason of at least 10 characters.").max(500),
});

export const adminModelUpdateSchema = z
  .object({
    routingEnabled: z.boolean().optional(),
    availability: z.enum(["available", "degraded", "unavailable"]).optional(),
    providerCostUsd: z.number().min(0).max(1000).nullable().optional(),
    reason: z.string().trim().min(10, "Give a reason of at least 10 characters.").max(500),
  })
  .refine((value) => value.routingEnabled !== undefined || value.availability !== undefined || value.providerCostUsd !== undefined, {
    message: "Nothing to update.",
  });

export const adminPricingSchema = z.object({
  styleId: z.enum(styleIds),
  qualityId: z.enum(qualityIds),
  resolution: z.string().trim().max(20).nullable().optional(),
  credits: z.number().int().min(1).max(10000),
  approved: z.boolean(),
  notes: z.string().trim().max(500).nullable().optional(),
});

export const adminSettingsSchema = z.object({
  key: z.string().trim().min(2).max(80),
  value: z.unknown(),
});

export type CreateGenerationBody = z.infer<typeof createGenerationSchema>;
export type CreateUploadBody = z.infer<typeof createUploadSchema>;
export type CreateOrderBody = z.infer<typeof createOrderSchema>;
export type VerifyPaymentBody = z.infer<typeof verifyPaymentSchema>;
export type ContactBody = z.infer<typeof contactSchema>;
export type UpdateProfileBody = z.infer<typeof updateProfileSchema>;

/* ---------------------------------- Auth ---------------------------------- */

const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters.")
  .max(72, "Use 72 characters or fewer.");

export const signUpSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address.").max(254),
  password: passwordSchema,
  displayName: z.string().trim().min(2, "Use at least 2 characters.").max(80).optional(),
});

export const signInSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address.").max(254),
  password: z.string().min(1, "Enter your password.").max(72),
});

export const recoverySchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address.").max(254),
});

export const updatePasswordSchema = z.object({ password: passwordSchema });
