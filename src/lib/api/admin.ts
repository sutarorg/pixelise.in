/**
 * Admin API surface shared by server and browser code.
 *
 * Every path below is authorized by the backend on every request. The console
 * never holds a role token, never decodes a JWT and never decides that an action
 * is allowed — it asks, and renders whatever the server answers.
 */

import { request, withQuery } from "./core";
import type { ApiResult } from "./types";
import type {
  AdminConfig,
  AdminCreditAdjustmentInput,
  AdminCreditAdjustmentResult,
  AdminGenerationDetail,
  AdminIdentity,
  AdminModel,
  AdminModelSettingInput,
  AdminOverview,
  AdminPaginated,
  AdminPaymentDetail,
  AdminUserDetail,
  AdminUserRow,
  AdminUserStatusInput,
} from "./admin-types";

export const adminPaths = {
  me: "/api/v1/admin/me",
  overview: "/api/v1/admin/overview",
  users: "/api/v1/admin/users",
  user: (id: string) => `/api/v1/admin/users/${encodeURIComponent(id)}`,
  userStatus: (id: string) => `/api/v1/admin/users/${encodeURIComponent(id)}/status`,
  generations: "/api/v1/admin/generations",
  generation: (id: string) => `/api/v1/admin/generations/${encodeURIComponent(id)}`,
  payments: "/api/v1/admin/payments",
  payment: (id: string) => `/api/v1/admin/payments/${encodeURIComponent(id)}`,
  credits: "/api/v1/admin/credits",
  creditAdjust: "/api/v1/admin/credits/adjust",
  models: "/api/v1/admin/models",
  modelSetting: (id: string) => `/api/v1/admin/models/${encodeURIComponent(id)}`,
  config: "/api/v1/admin/config",
  auditLogs: "/api/v1/admin/audit-logs",
} as const;

/** Query string shared by every list endpoint. */
export type ListQuery = Record<string, string | undefined>;

export function listPath(base: string, query: ListQuery): string {
  return withQuery(base, query);
}

/* ------------------------------ Browser calls ------------------------------ */

export const fetchGenerationDetail = (id: string) =>
  request<AdminGenerationDetail>(adminPaths.generation(id));

export const fetchPaymentDetail = (id: string) =>
  request<AdminPaymentDetail>(adminPaths.payment(id));

export const fetchUserDetail = (id: string) =>
  request<AdminUserDetail>(adminPaths.user(id));

export const adjustCredits = (input: AdminCreditAdjustmentInput) =>
  request<AdminCreditAdjustmentResult>(adminPaths.creditAdjust, {
    method: "POST",
    body: input,
    headers: { "Idempotency-Key": idempotencyKey() },
  });

export const updateUserStatus = (id: string, input: AdminUserStatusInput) =>
  request<AdminUserRow>(adminPaths.userStatus(id), { method: "PATCH", body: input });

export const updateModelSetting = (id: string, input: AdminModelSettingInput) =>
  request<AdminModel>(adminPaths.modelSetting(id), { method: "PATCH", body: input });

export const fetchAdminIdentity = () => request<AdminIdentity>(adminPaths.me);

export const fetchAdminConfig = () => request<AdminConfig>(adminPaths.config);

/** Lists used by client-side retries; the server components use admin-server.ts. */
export const fetchOverview = (query: ListQuery) =>
  request<AdminOverview>(listPath(adminPaths.overview, query));

export function idempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export type AdminResult<T> = ApiResult<T>;
export type { AdminPaginated };
