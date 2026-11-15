import "server-only";

import { cache } from "react";
import { headers } from "next/headers";

import { apiPaths, request, withQuery } from "./core";
import type {
  ApiResult,
  BillingOrder,
  CreateUploadInput,
  CreditPack,
  CreditTransaction,
  CreditTransactionType,
  CustomerProfile,
  Generation,
  NotificationPreferences,
  Paginated,
  PaymentRecord,
  StudioConfig,
  UploadAsset,
  UploadTicket,
} from "./types";

/**
 * Server-side API client.
 *
 * Runs in Server Components and Server Actions. It forwards the incoming
 * session cookie to the workspace service so the service — not the browser —
 * decides who the caller is. Never import this from a client component.
 */

async function authHeaders(): Promise<Record<string, string>> {
  const incoming = await headers();
  const cookie = incoming.get("cookie");
  const authorization = incoming.get("authorization");
  return {
    ...(cookie ? { cookie } : {}),
    ...(authorization ? { authorization } : {}),
  };
}

export async function serverGet<T>(path: string): Promise<ApiResult<T>> {
  return request<T>(path, { headers: await authHeaders() });
}

export async function serverPost<T>(path: string, body?: unknown): Promise<ApiResult<T>> {
  return request<T>(path, { method: "POST", body, headers: await authHeaders() });
}

/* ------------------------------ Read models -------------------------------- */

/*
 * Per-request memoisation. Two components on one page (the frame and the page
 * body) can ask for the same wallet; `cache` collapses that into one call
 * without ever storing customer data across requests.
 */
export const getProfile = cache(() => serverGet<CustomerProfile>(apiPaths.me));

export const getPreferences = cache(() =>
  serverGet<NotificationPreferences>(apiPaths.preferences),
);

export const getWallet = cache(() =>
  serverGet<{ available: number; reserved: number; updatedAt: string }>(apiPaths.wallet),
);

export const getPacks = cache(() => serverGet<CreditPack[]>(apiPaths.packs));

export const getStudioConfig = cache(() => serverGet<StudioConfig>(apiPaths.studioConfig));

export function getTransactions(params: {
  type?: CreditTransactionType | "all";
  cursor?: string;
}): Promise<ApiResult<Paginated<CreditTransaction>>> {
  return serverGet(
    withQuery(apiPaths.transactions, {
      type: params.type && params.type !== "all" ? params.type : undefined,
      cursor: params.cursor,
    }),
  );
}

export function getPayments(params: {
  cursor?: string;
}): Promise<ApiResult<Paginated<PaymentRecord>>> {
  return serverGet(withQuery(apiPaths.payments, { cursor: params.cursor }));
}

export function getGenerations(params: {
  style?: string | "all";
  sort?: "newest" | "oldest";
  cursor?: string;
  limit?: string;
}): Promise<ApiResult<Paginated<Generation>>> {
  return serverGet(
    withQuery(apiPaths.generations, {
      style: params.style && params.style !== "all" ? params.style : undefined,
      sort: params.sort && params.sort !== "newest" ? params.sort : undefined,
      cursor: params.cursor,
      limit: params.limit,
    }),
  );
}

export const getGeneration = (id: string) => serverGet<Generation>(apiPaths.generation(id));

/* --------------------------- Contracts for stage 4 -------------------------- */

/**
 * Kept here (unused by the UI in this stage) so the server-side half of the
 * upload contract exists in one place and stage 4 only has to implement it.
 */
export const createUploadTicketServer = (input: CreateUploadInput) =>
  serverPost<UploadTicket>(apiPaths.uploads, input);

export const completeUploadServer = (id: string) =>
  serverPost<UploadAsset>(apiPaths.uploadComplete(id));

export const createOrderServer = (packId: string) =>
  serverPost<BillingOrder>(apiPaths.orders, { packId });
