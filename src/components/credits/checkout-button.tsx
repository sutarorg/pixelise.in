"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { createBillingOrder, verifyPayment } from "@/lib/api/browser";

type RazorpayResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayInstance = { open: () => void };

type RazorpayConstructor = new (options: Record<string, unknown>) => RazorpayInstance;

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

const CHECKOUT_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

function loadCheckout(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);

  return new Promise((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${CHECKOUT_SCRIPT}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(Boolean(window.Razorpay)));
      existing.addEventListener("error", () => resolve(false));
      return;
    }
    const script = document.createElement("script");
    script.src = CHECKOUT_SCRIPT;
    script.async = true;
    script.onload = () => resolve(Boolean(window.Razorpay));
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

/**
 * Checkout.
 *
 * Three rules from the payment research are enforced here:
 * 1. the amount and pack come from the order the server created for us;
 * 2. a Checkout callback is not proof of payment — we ask the server to verify
 *    the signature and then wait for its verdict;
 * 3. nothing is credited, unlocked or celebrated in the browser.
 */
export function CheckoutButton({
  packId,
  label,
  highlighted,
}: {
  packId: string;
  label: string;
  highlighted?: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [verifying, setVerifying] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);

  async function handleClick() {
    if (pending || verifying) return;
    setError(null);
    setNotice(null);
    setPending(true);

    const order = await createBillingOrder(packId);
    if (!order.ok) {
      setPending(false);
      setError(
        order.error.code === "not_configured"
          ? "Payments open once this workspace is connected to the Pixelise service. Nothing was charged."
          : order.error.message,
      );
      return;
    }

    const ready = await loadCheckout();
    if (!ready || !window.Razorpay) {
      setPending(false);
      setError("We couldn't open the payment window. Check your connection and try again.");
      return;
    }

    const checkout = new window.Razorpay({
      key: order.data.keyId,
      amount: order.data.amountPaise,
      currency: order.data.currency,
      order_id: order.data.orderId,
      name: "Pixelise",
      description: `${order.data.credits} credits`,
      theme: { color: "#6045F5" },
      handler: async (response: RazorpayResponse) => {
        setPending(false);
        setVerifying(true);
        const verified = await verifyPayment({
          orderId: response.razorpay_order_id,
          paymentId: response.razorpay_payment_id,
          signature: response.razorpay_signature,
        });
        setVerifying(false);

        if (!verified.ok) {
          setError(verified.error.message);
          return;
        }

        if (verified.data.status === "paid") {
          setNotice("Payment confirmed by Pixelise. Your credits are in your balance.");
          router.refresh();
          return;
        }

        if (verified.data.status === "verifying") {
          setNotice(
            "Payment received. Credits are added once Pixelise confirms it with the bank — refresh in a moment to see the new balance.",
          );
          return;
        }

        setError(
          "We couldn't verify that payment, so no credits were added. If money left your account, keep the order id and contact support.",
        );
      },
      modal: {
        ondismiss: () => setPending(false),
      },
    });

    checkout.open();
  }

  return (
    <div>
      <Button
        type="button"
        size="lg"
        variant={highlighted ? "primary" : "secondary"}
        className="w-full"
        onClick={handleClick}
        disabled={pending || verifying}
      >
        {pending || verifying ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : null}
        {verifying ? "Verifying payment…" : pending ? "Opening checkout…" : label}
      </Button>

      {notice ? (
        <Alert tone="success" live className="mt-2.5">
          {notice}
        </Alert>
      ) : null}
      {error ? (
        <Alert tone="danger" live className="mt-2.5">
          {error}
        </Alert>
      ) : null}
    </div>
  );
}
