"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useBillingToast } from "@/components/billing/BillingToast";
import { invalidateCreditsCache } from "@/hooks/useCredits";
import type { CreditPackOption } from "@/lib/credits/purchase";
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

type CreditPackButtonProps = {
  pack: CreditPackOption;
  className?: string;
};

function loadRazorpayScript(): Promise<void> {
  if (window.Razorpay) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Failed to load Razorpay checkout"));
    document.body.appendChild(script);
  });
}

export default function CreditPackButton({
  pack,
  className,
}: CreditPackButtonProps) {
  const router = useRouter();
  const { showToast } = useBillingToast();
  const [isLoading, setIsLoading] = useState(false);
  const checkoutStartedRef = useRef(false);

  const handleClick = async () => {
    if (isLoading || checkoutStartedRef.current) return;

    checkoutStartedRef.current = true;
    setIsLoading(true);

    try {
      const orderResponse = await fetch("/api/razorpay/create-credit-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credits: pack.credits }),
      });
      const orderPayload = await orderResponse.json();

      if (!orderResponse.ok) {
        throw new Error(
          orderPayload.error ?? "Failed to start checkout. Please try again."
        );
      }

      await loadRazorpayScript();
      if (!window.Razorpay) {
        throw new Error("Razorpay checkout failed to load.");
      }

      const razorpay = new window.Razorpay(
        createRazorpayCheckoutOptions({
          keyId: orderPayload.keyId,
          orderId: orderPayload.orderId,
          planName: `${pack.label} — Advora AI Credits`,
          prefill: orderPayload.prefill,
          handler: async (response: RazorpaySuccessResponse) => {
            setIsLoading(true);
            try {
              const verifyResponse = await fetch(
                "/api/razorpay/verify-credit-purchase",
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    credits: pack.credits,
                    purchaseId: orderPayload.purchaseId,
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                  }),
                }
              );
              const verifyPayload = await verifyResponse.json();

              if (!verifyResponse.ok) {
                throw new Error(
                  verifyPayload.error ??
                    "Payment verification failed. Please contact support."
                );
              }

              invalidateCreditsCache();
              window.dispatchEvent(new CustomEvent("advora:refresh-credits"));
              showToast(
                `${pack.credits} credits added to your account.`,
                "success"
              );
              router.refresh();
              router.push("/dashboard/billing?payment=success");
            } catch (error) {
              const message =
                error instanceof Error
                  ? error.message
                  : "Payment verification failed.";
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
            showToast("Payment was cancelled.", "info");
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
      showToast(message, "error");
      checkoutStartedRef.current = false;
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      disabled={isLoading}
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
        `Buy ${pack.credits} credits`
      )}
    </button>
  );
}
