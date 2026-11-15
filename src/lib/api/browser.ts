/**
 * Browser-side API client.
 *
 * Used by interactive components (studio, checkout, settings). Requests are
 * same-origin by default and always carry the session cookie; the workspace
 * service still authorizes every call. Nothing here holds a secret, computes a
 * price, deducts credits or fabricates a result.
 */

import { apiPaths, request } from "./core";
import type {
  ApiResult,
  AuthSignInResult,
  AuthSignUpResult,
  BillingOrder,
  CreateGenerationInput,
  CreateGenerationResult,
  CreateUploadInput,
  CreditWallet,
  CustomerProfile,
  Generation,
  NotificationPreferences,
  PaymentVerificationInput,
  Paginated,
  PaymentVerificationResult,
  UploadAsset,
  UploadTicket,
} from "./types";

export const createUploadTicket = (input: CreateUploadInput) =>
  request<UploadTicket>(apiPaths.uploads, { method: "POST", body: input });

export const completeUpload = (id: string) =>
  request<UploadAsset>(apiPaths.uploadComplete(id), { method: "POST" });

/**
 * Uploads the bytes straight to object storage with the exact headers the
 * service signed. The file never passes through the application server.
 */
export async function putFileToStorage(
  ticket: UploadTicket,
  file: File,
  signal?: AbortSignal,
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const response = await fetch(ticket.uploadUrl, {
      method: "PUT",
      headers: ticket.headers,
      body: file,
      credentials: "omit",
      referrerPolicy: "no-referrer",
      signal,
    });
    if (!response.ok) {
      return {
        ok: false,
        message: "The upload didn't finish. Check your connection and try again.",
      };
    }
    return { ok: true };
  } catch {
    return {
      ok: false,
      message: "The upload was interrupted before it finished. Nothing was charged.",
    };
  }
}

export const createGeneration = (input: CreateGenerationInput, idempotencyKey: string) =>
  request<CreateGenerationResult>(apiPaths.generations, {
    method: "POST",
    body: input,
    headers: { "Idempotency-Key": idempotencyKey },
  });

export function listGenerations(params: {
  style?: string;
  sort?: "newest" | "oldest";
  cursor?: string;
  limit?: string;
}) {
  const search = new URLSearchParams();
  if (params.style && params.style !== "all") search.set("style", params.style);
  if (params.sort && params.sort !== "newest") search.set("sort", params.sort);
  if (params.cursor) search.set("cursor", params.cursor);
  if (params.limit) search.set("limit", params.limit);
  const query = search.toString();
  return request<Paginated<Generation>>(
    `${apiPaths.generations}${query ? `?${query}` : ""}`,
  );
}

export const getGeneration = (id: string) =>
  request<Generation>(apiPaths.generation(id));

export const deleteGeneration = (id: string) =>
  request<{ id: string }>(apiPaths.generation(id), { method: "DELETE" });

export const createBillingOrder = (packId: string) =>
  request<BillingOrder>(apiPaths.orders, { method: "POST", body: { packId } });

export const verifyPayment = (input: PaymentVerificationInput) =>
  request<PaymentVerificationResult>(apiPaths.verifyPayment, {
    method: "POST",
    body: input,
  });

export const updateProfile = (input: { displayName: string }) =>
  request<CustomerProfile>(apiPaths.me, { method: "PATCH", body: input });

export const updatePreferences = (input: Partial<NotificationPreferences>) =>
  request<NotificationPreferences>(apiPaths.preferences, { method: "PATCH", body: input });

export const deleteAccount = (input: { confirmation: string }) =>
  request<{ status: "deleted" }>(apiPaths.me, { method: "DELETE", body: input });

export const signIn = (input: { email: string; password: string }) =>
  request<AuthSignInResult>(apiPaths.authSignIn, { method: "POST", body: input });

export const signUp = (input: { email: string; password: string; displayName?: string }) =>
  request<AuthSignUpResult>(apiPaths.authSignUp, { method: "POST", body: input });

export const requestPasswordRecovery = (input: { email: string }) =>
  request<{ status: "sent" }>(apiPaths.authRecovery, { method: "POST", body: input });

/** Used by the recovery link, which arrives already holding a session. */
export const updatePassword = (input: { password: string }) =>
  request<{ status: "updated" }>(apiPaths.authUpdatePassword, { method: "POST", body: input });

export const signOut = () => request<{ status: "signed_out" }>(apiPaths.authSignOut, { method: "POST" });

export type WalletResult = ApiResult<CreditWallet>;
