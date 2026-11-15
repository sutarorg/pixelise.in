import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { serverEnv } from "@/config/env";
import { failures } from "@/lib/http/errors";
import { createLogger } from "@/lib/logging";

/**
 * Razorpay adapter (Orders + Payments REST, plus signature verification).
 *
 * No SDK: the integration is three HTTP calls and two HMAC checks, and keeping
 * them explicit makes the trust boundary obvious. Nothing in this file decides
 * whether credits are granted — that is the payment service's job, after the
 * provider confirms a capture.
 */

const log = createLogger("razorpay");

function credentials(): { keyId: string; keySecret: string; auth: string } {
  const keyId = serverEnv.razorpay.keyId;
  const keySecret = serverEnv.razorpay.keySecret;
  if (!keyId || !keySecret) {
    throw failures.notConfigured("Payments aren't connected yet. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.");
  }
  return {
    keyId,
    keySecret,
    auth: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
  };
}

async function razorpayFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { auth } = credentials();
  const response = await fetch(`${serverEnv.razorpay.apiBaseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: auth,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
    redirect: "error",
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    log.error("request rejected", { path, status: response.status, body: body.slice(0, 200) });
    throw failures.unavailable("The payment provider is not responding as expected.");
  }

  return (await response.json()) as T;
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  status: "created" | "attempted" | "paid";
  receipt: string | null;
}

export async function createRazorpayOrder(input: {
  amountPaise: number;
  receipt: string;
  notes: Record<string, string>;
}): Promise<RazorpayOrder> {
  return razorpayFetch<RazorpayOrder>("/orders", {
    method: "POST",
    body: JSON.stringify({
      amount: input.amountPaise,
      currency: "INR",
      receipt: input.receipt,
      notes: input.notes,
      /* One attempt per order keeps reconciliation unambiguous. */
      payment_capture: 1,
    }),
  });
}

export interface RazorpayPayment {
  id: string;
  order_id: string | null;
  amount: number;
  currency: string;
  status: "created" | "authorized" | "captured" | "refunded" | "failed";
  method: string | null;
  captured: boolean;
  error_description?: string | null;
}

/**
 * The authoritative read. Used both by checkout verification and by the webhook
 * handler: a webhook is only a notification, never proof.
 */
export async function fetchRazorpayPayment(paymentId: string): Promise<RazorpayPayment> {
  return razorpayFetch<RazorpayPayment>(`/payments/${encodeURIComponent(paymentId)}`);
}

/** Razorpay's documented checkout signature: HMAC_SHA256(`${order_id}|${payment_id}`). */
export function verifyCheckoutSignature(input: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const { keySecret } = credentials();
  const expected = createHmac("sha256", keySecret)
    .update(`${input.orderId}|${input.paymentId}`)
    .digest("hex");
  return timingSafeEqualHex(expected, input.signature);
}

/** Webhook signature: HMAC_SHA256 over the raw body with the webhook secret. */
export function verifyWebhookSignature(input: { rawBody: string; signature: string | null }): boolean {
  if (!serverEnv.razorpay.webhookSecret || !input.signature) return false;
  const expected = createHmac("sha256", serverEnv.razorpay.webhookSecret)
    .update(input.rawBody)
    .digest("hex");
  return timingSafeEqualHex(expected, input.signature);
}

function timingSafeEqualHex(expected: string, provided: string): boolean {
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(provided, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function publicKeyId(): string {
  return credentials().keyId;
}

/** All payments attempted against one order, used by reconciliation. */
export async function fetchOrderPayments(orderId: string): Promise<{ items: RazorpayPayment[] }> {
  return razorpayFetch<{ items: RazorpayPayment[] }>(
    `/orders/${encodeURIComponent(orderId)}/payments`,
  );
}
