import "server-only";

import { cache } from "react";

import { serverGet } from "./server";
import { adminPaths, listPath, type ListQuery } from "./admin";
import type { ApiResult } from "./types";
import type {
  AdminAuditRow,
  AdminConfig,
  AdminGenerationDetail,
  AdminGenerationRow,
  AdminIdentity,
  AdminLedgerRow,
  AdminModel,
  AdminOverview,
  AdminPaginated,
  AdminPaymentDetail,
  AdminPaymentRow,
  AdminUserDetail,
  AdminUserRow,
} from "./admin-types";

/**
 * Server-side reads for the admin console.
 *
 * The incoming session cookie is forwarded to the workspace service, which is
 * the only thing that decides whether this caller is an admin. Nothing is cached
 * across requests (`no-store` in the transport); `cache()` only dedupes within a
 * single render.
 */

const get = <T,>(path: string) => serverGet<T>(path);

export const getAdminIdentity = cache(() => get<AdminIdentity>(adminPaths.me));

export const getOverview = (query: ListQuery) =>
  get<AdminOverview>(listPath(adminPaths.overview, query));

export const listUsers = (query: ListQuery) =>
  get<AdminPaginated<AdminUserRow>>(listPath(adminPaths.users, query));

export const getUserDetail = (id: string) => get<AdminUserDetail>(adminPaths.user(id));

export const listGenerations = (query: ListQuery) =>
  get<AdminPaginated<AdminGenerationRow>>(listPath(adminPaths.generations, query));

export const getGenerationDetail = (id: string) =>
  get<AdminGenerationDetail>(adminPaths.generation(id));

export const listPayments = (query: ListQuery) =>
  get<AdminPaginated<AdminPaymentRow>>(listPath(adminPaths.payments, query));

export const getPaymentDetail = (id: string) => get<AdminPaymentDetail>(adminPaths.payment(id));

export const listCreditTransactions = (query: ListQuery) =>
  get<AdminPaginated<AdminLedgerRow>>(listPath(adminPaths.credits, query));

export const listModels = () => get<AdminModel[]>(adminPaths.models);

export const getConfig = cache(() => get<AdminConfig>(adminPaths.config));

export const listAuditLogs = (query: ListQuery) =>
  get<AdminPaginated<AdminAuditRow>>(listPath(adminPaths.auditLogs, query));

export type AdminListResult<T> = ApiResult<AdminPaginated<T>>;
