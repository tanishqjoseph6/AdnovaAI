"use client";

import { useEffect, useRef } from "react";
import { useBillingToast } from "@/components/billing/BillingToast";

type BillingPaymentToastsProps = {
  payment?: string;
  message?: string;
};

export default function BillingPaymentToasts({
  payment,
  message,
}: BillingPaymentToastsProps) {
  const { showToast } = useBillingToast();
  const shownRef = useRef<string | null>(null);

  useEffect(() => {
    if (!payment || shownRef.current === payment) {
      return;
    }

    shownRef.current = payment;

    if (payment === "success") {
      showToast(
        "Payment successful. Your subscription is now active.",
        "success"
      );
      return;
    }

    if (payment === "cancelled") {
      showToast(
        message ?? "Payment was cancelled. You can try again anytime.",
        "info"
      );
      return;
    }

    if (payment === "error") {
      showToast(
        message ?? "Payment failed. Please try again.",
        "error"
      );
    }
  }, [payment, message, showToast]);

  return null;
}
