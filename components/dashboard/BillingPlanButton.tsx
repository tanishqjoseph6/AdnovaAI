"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useBillingToast } from "@/components/billing/BillingToast";
import { invalidateCreditsCache } from "@/hooks/useCredits";
import type { PaidPlanId } from "@/lib/billing/plans";
import type { BillingInterval } from "@/lib/billing/pricing";

type BillingPlanButtonProps = {
  plan: PaidPlanId;
  interval?: BillingInterval;
  className?: string;
  children: React.ReactNode;
  disabled?: boolean;
  onError?: (message: string) => void;
};

export default function BillingPlanButton({
  plan,
  interval = "monthly",
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
      const checkoutResponse = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, interval }),
      });

      const checkoutPayload = await checkoutResponse.json();

      if (!checkoutResponse.ok) {
        throw new Error(
          checkoutPayload.error ??
            "Checkout is unavailable. Please try again or contact support."
        );
      }

      if (typeof checkoutPayload.url === "string") {
        showToast("Redirecting to secure Stripe checkout…", "info");
        window.location.href = checkoutPayload.url;
        return;
      }

      throw new Error("Invalid checkout response.");
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
