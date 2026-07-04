"use client";

import { useEffect, useRef } from "react";
import { useAuthToast } from "@/components/auth/AuthToast";
import { useCredits } from "@/hooks/useCredits";
import { CREDIT_REFILL_TOAST_MESSAGE } from "@/lib/credits/refill";

export default function CreditRefillToast() {
  const { credits } = useCredits();
  const { showToast } = useAuthToast();
  const lastRefilledAt = useRef<string | null>(null);

  useEffect(() => {
    if (!credits?.refilledJustNow) {
      return;
    }

    const marker = `${credits.updatedAt}:${credits.credits}`;
    if (lastRefilledAt.current === marker) {
      return;
    }

    lastRefilledAt.current = marker;
    showToast(CREDIT_REFILL_TOAST_MESSAGE, "success");
  }, [credits, showToast]);

  return null;
}
