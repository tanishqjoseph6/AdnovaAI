"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PaidPlanId } from "@/lib/billing/plans";
import { createRazorpayCheckoutOptions } from "@/lib/razorpay/checkout-options";

type RazorpaySuccessResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayConstructor = new (options: Record<string, unknown>) => {
  open: () => void;
};

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

type BillingPlanButtonProps = {
  plan: PaidPlanId;
  className?: string;
  children: React.ReactNode;
  disabled?: boolean;
  onError?: (message: string) => void;
};

function loadRazorpayScript(): Promise<void> {
  if (window.Razorpay) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );

    if (existing) {
      if (window.Razorpay) {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Failed to load Razorpay checkout")),
        { once: true }
      );
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Failed to load Razorpay checkout"));
    document.body.appendChild(script);
  });
}

export default function BillingPlanButton({
  plan,
  className,
  children,
  disabled = false,
  onError,
}: BillingPlanButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (disabled || isLoading) {
      return;
    }

    setIsLoading(true);

    try {
      const orderResponse = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      const orderPayload = await orderResponse.json();

      if (!orderResponse.ok) {
        throw new Error(
          orderPayload.error ?? "Failed to start checkout. Please try again."
        );
      }

      if (!orderPayload.keyId) {
        throw new Error("Razorpay is not configured. Please contact support.");
      }

      await loadRazorpayScript();

      if (!window.Razorpay) {
        throw new Error("Razorpay checkout failed to load.");
      }

      const razorpay = new window.Razorpay(
        createRazorpayCheckoutOptions({
          keyId: orderPayload.keyId,
          orderId: orderPayload.orderId,
          planName: orderPayload.planName,
          prefill: orderPayload.prefill,
          handler: async (response: RazorpaySuccessResponse) => {
            try {
              const verifyResponse = await fetch("/api/razorpay/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  plan,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              });

              const verifyPayload = await verifyResponse.json();

              if (!verifyResponse.ok) {
                throw new Error(
                  verifyPayload.error ??
                    "Payment verification failed. Please contact support."
                );
              }

              router.refresh();
              router.push("/dashboard/billing?payment=success");
            } catch (error) {
              const message =
                error instanceof Error
                  ? error.message
                  : "Payment verification failed.";
              onError?.(message);
              router.push(
                `/dashboard/billing?payment=error&message=${encodeURIComponent(message)}`
              );
            }
          },
          onDismiss: () => {
            onError?.("Payment was cancelled. You can try again anytime.");
            router.push(
              "/dashboard/billing?payment=cancelled&message=Payment%20was%20cancelled"
            );
          },
        })
      );

      razorpay.open();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Payment could not be started. Please try again.";
      onError?.(message);
      router.push(
        `/dashboard/billing?payment=error&message=${encodeURIComponent(message)}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={className}
      aria-busy={isLoading}
    >
      {isLoading ? "Opening checkout..." : children}
    </button>
  );
}
