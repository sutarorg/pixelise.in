/**
 * Domain types for the Pixelise customer application.
 *
 * These are the request/response shapes that the backend (stage 4) must
 * implement. They are consumed by server components, client components and the
 * API client alike, so this module is deliberately free of runtime code and of
 * any `next/*` import.
 *
 * Nothing here contains sample values. Every field is populated by a real API
 * response; the UI has designed states for "not loaded", "empty" and "error".
 */

/* --------------------------------- Identity -------------------------------- */

export interface CustomerProfile {
  id: string;
  /** Null when the account has no display name yet — the UI then greets neutrally. */
  displayName: string | null;
  email: string;
  avatarUrl: string | null;
  emailVerified: boolean;
  /** ISO 8601. */
  createdAt: string;
  /** ISO 8601 of the previous sign-in, when the service reports it. */
  lastSignInAt?: string | null;
}

/* --------------------------------- Credits --------------------------------- */

export interface CreditWallet {
  /** Credits that can be spent right now. */
  available: number;
  /** Credits held by in-flight generations. Server-authored. */
  reserved: number;
  /** ISO 8601, when the server last settled the wallet. */
  updatedAt: string;
}

export type CreditTransactionType = "purchase" | "generation" | "refund" | "adjustment";

export type CreditTransactionStatus = "pending" | "completed" | "failed" | "reversed";

export interface CreditTransaction {
  id: string;
  type: CreditTransactionType;
  status: CreditTransactionStatus;
  /** Short, human sentence written by the server, e.g. "Studio pack purchase". */
  description: string;
  /** Positive for credits added, negative for credits spent. */
  credits: number;
  /** Amount paid in paise; null for non-payment rows. */
  amountPaise: number | null;
  currency: "INR" | null;
  /** ISO 8601. */
  createdAt: string;
  /** Links a generation row back to its creation, when one exists. */
  generationId: string | null;
}

export interface CreditPack {
  id: string;
  name: string;
  /** Server-authored price in paise. The client never computes this. */
  pricePaise: number;
  currency: "INR";
  credits: number;
  purchaseType: "one-time";
  highlighted: boolean;
  badge: string | null;
  description: string;
  /** What the pack includes, written by the server. */
  includes: string[];
}

/* ---------------------------------- Studio --------------------------------- */

export type PhotographyStyleId = "studio" | "lifestyle" | "advertising";

export interface PhotographyStyle {
  id: string;
  name: string;
  /** One line, shown under the name. */
  summary: string;
  /** Two sentences at most, shown in the style card. */
  description: string;
  /** Optional server-supplied thumbnail. Falls back to the branded artwork. */
  thumbnailUrl: string | null;
}

export interface StudioScene {
  id: string;
  name: string;
  /** One line describing the set and light. */
  description: string;
  /** Scenes the server allows for each style. */
  styleIds: string[];
}

export interface AspectRatioOption {
  id: string;
  label: string;
  /** Used only for the preview frame, never to compute a price. */
  width: number;
  height: number;
  description: string;
}

export interface QualityOption {
  id: string;
  label: string;
  description: string;
  /** Credits this quality costs. Server-authored — null means unknown. */
  credits: number | null;
}

export interface StudioConfig {
  styles: PhotographyStyle[];
  scenes: StudioScene[];
  aspectRatios: AspectRatioOption[];
  qualities: QualityOption[];
  maxUploadBytes: number;
  acceptedMimeTypes: string[];
}

/* -------------------------------- Generation ------------------------------- */

export type GenerationStatus =
  | "queued"
  | "preparing"
  | "rendering"
  | "completed"
  | "failed"
  | "cancelled";

export interface Generation {
  id: string;
  status: GenerationStatus;
  styleId: string;
  styleName: string;
  sceneId: string | null;
  sceneName: string | null;
  aspectRatio: string;
  qualityId: string;
  qualityLabel: string;
  /** Pixel size of the result, when the server knows it. */
  width: number | null;
  height: number | null;
  /** Credits actually settled. Null while pending; 0 when refunded. */
  creditsCharged: number | null;
  /** Credits held while the job runs. */
  creditsReserved: number | null;
  createdAt: string;
  completedAt: string | null;
  /** Customer-safe explanation when status is "failed". */
  failureReason: string | null;
  sourceUrl: string | null;
  resultUrl: string | null;
  /** Small derivative for grids; falls back to resultUrl. */
  thumbnailUrl: string | null;
}

export interface CreateGenerationInput {
  assetId: string;
  styleId: string;
  sceneId: string;
  aspectRatioId: string;
  qualityId: string;
}

export interface CreateGenerationResult {
  generation: Generation;
  /** Server-priced cost for this job, before it runs. */
  estimatedCredits: number;
}

/* ---------------------------------- Uploads -------------------------------- */

export interface UploadTicket {
  /** Server-side upload id, passed to the complete endpoint. */
  id: string;
  /** Presigned PUT URL — time limited, seconds. */
  uploadUrl: string;
  /** Headers that must be sent verbatim with the PUT (Content-Type). */
  headers: Record<string, string>;
  /** Object key recorded server-side. */
  key: string;
  /** ISO 8601 expiry of the signed URL. */
  expiresAt: string;
}

export interface UploadAsset {
  id: string;
  width: number | null;
  height: number | null;
  bytes: number;
  mimeType: string;
  createdAt: string;
}

export interface CreateUploadInput {
  filename: string;
  mimeType: string;
  bytes: number;
}

/* ---------------------------------- Billing -------------------------------- */

export type PaymentStatus = "created" | "attempted" | "paid" | "failed" | "refunded";

export interface BillingOrder {
  /** Razorpay order id. */
  orderId: string;
  /** Public key id for Checkout. Never the secret. */
  keyId: string;
  amountPaise: number;
  currency: "INR";
  packId: string;
  credits: number;
  /** ISO 8601. */
  expiresAt: string;
}

export interface PaymentVerificationInput {
  orderId: string;
  paymentId: string;
  signature: string;
}

export interface PaymentVerificationResult {
  /** "verifying" until the server (or webhook) confirms; never "paid" from the client. */
  status: "verifying" | "paid" | "failed";
  creditsAdded: number | null;
  wallet: CreditWallet | null;
}

export interface PaymentRecord {
  id: string;
  orderId: string;
  packName: string;
  amountPaise: number;
  currency: "INR";
  status: PaymentStatus;
  credits: number;
  createdAt: string;
}

/* -------------------------------- Preferences ------------------------------ */

export interface NotificationPreferences {
  generationComplete: boolean;
  creditReceipts: boolean;
  productUpdates: boolean;
}

/* -------------------------------- Transport -------------------------------- */

export interface Paginated<T> {
  items: T[];
  /** Opaque cursor; null when there is nothing more. */
  nextCursor: string | null;
  /** Total rows for the current filter, when the service can afford to count. */
  total: number | null;
}

export type ApiErrorCode =
  | "unauthenticated"
  | "forbidden"
  | "not_found"
  | "validation_failed"
  | "insufficient_credits"
  | "rate_limited"
  | "conflict"
  | "payment_failed"
  | "service_unavailable"
  /** Client-side only: no API base URL is configured in this environment. */
  | "not_configured"
  /** Client-side only: the request never reached the server. */
  | "network_error"
  | "internal_error";

export interface ApiError {
  code: ApiErrorCode;
  /** Customer-safe sentence. The UI renders this verbatim. */
  message: string;
  /** HTTP status, or 0 for a transport failure. */
  status: number;
  /** Whether retrying the same request could succeed. */
  retryable: boolean;
  /** Correlation id from the service, when provided. */
  requestId: string | null;
}

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiError };

/* ---------------------------------- Auth ---------------------------------- */

export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthSignInResult {
  status: "signed_in";
  user: AuthUser;
}

export interface AuthSignUpResult {
  /** `pending_verification` means Supabase created the user but withheld the session. */
  status: "signed_in" | "pending_verification";
  user: AuthUser | null;
}
