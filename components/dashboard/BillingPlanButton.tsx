"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useBillingToast } from "@/components/billing/BillingToast";
import { invalidateCreditsCache } from "@/hooks/useCredits";
import type { PaidPlanId } from "@/lib/billing/plans";
import type { BillingCurrency, BillingInterval } from "@/lib/billing/pricing";
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
  interval?: BillingInterval;
  currency?: BillingCurrency;
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
  interval = "monthly",
  currency = "INR",
  className,
  children,
  disabled = false,
  onError,
}: BillingPlanButtonProps) {
  const router = useRouter();
  const { showToast } = useBillingToast();
  const [isLoading, setIsLoading] = useState(false);
  const checkoutStartedRef = useRef(false);

  const handleClick = async () => {
    if (disabled || isLoading || checkoutStartedRef.current) {
      return;
    }

    checkoutStartedRef.current = true;
    setIsLoading(true);

    try {
      if (currency === "USD") {
        const checkoutResponse = await fetch("/api/stripe/create-checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan, interval, currency }),
        });

        const checkoutPayload = await checkoutResponse.json();

        if (!checkoutResponse.ok) {
          throw new Error(
            checkoutPayload.error ??
              "USD checkout is not available yet. Please use INR billing."
          );
        }

        if (typeof checkoutPayload.url === "string") {
          showToast("Redirecting to secure Stripe checkout…", "info");
          window.location.href = checkoutPayload.url;
          return;
        }

        throw new Error("Invalid Stripe checkout response.");
      }

      const orderResponse = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, interval, currency }),
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
            setIsLoading(true);
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

              invalidateCreditsCache();
              showToast(
                "Payment successful. Your subscription is now active.",
                "success"
              );
              router.refresh();
              router.push("/dashboard/billing?payment=success");
            } catch (error) {
              const message =
                error instanceof Error
                  ? error.message
                  : "Payment verification failed.";
              onError?.(message);
              showToast(message, "error");
              router.push(
                `/dashboard/billing?payment=error&message=${encodeURIComponent(message)}`
              );
            } finally {
              checkoutStartedRef.current = false;
              setIsLoading(false);
            }
          },
          onDismiss: () => {
            checkoutStartedRef.current = false;
            setIsLoading(false);
            const cancelMessage =
              "Payment was cancelled. You can try again anytime.";
            onError?.(cancelMessage);
            showToast(cancelMessage, "info");
            router.push(
              "/dashboard/billing?payment=cancelled&message=Payment%20was%20cancelled"
            );
          },
        })
      );

      setIsLoading(false);
      razorpay.open();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Payment could not be started. Please try again.";
      onError?.(message);
      showToast(message, "error");
      router.push(
        `/dashboard/billing?payment=error&message=${encodeURIComponent(message)}`
      );
      checkoutStartedRef.current = false;
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      disabled={disabled || isLoading}
      className={`${className ?? ""} ${
        isLoading ? "cursor-wait opacity-80" : ""
      }`}
      aria-busy={isLoading}
    >
      {isLoading ? (
        <span className="inline-flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Opening checkout…
        </span>
      ) : (
        children
      )}
    </button>
  );
}
