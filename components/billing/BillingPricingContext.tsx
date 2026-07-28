"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { PaidPlanId } from "@/lib/billing/plans";
import {
  getCheckoutLabel,
  getPlanPriceQuote,
  type BillingInterval,
  type PlanPriceQuote,
} from "@/lib/billing/pricing";

type BillingPricingContextValue = {
  interval: BillingInterval;
  setInterval: (interval: BillingInterval) => void;
  getQuote: (plan: PaidPlanId) => PlanPriceQuote;
  getButtonLabel: (plan: PaidPlanId, baseLabel: string) => string;
};

const BillingPricingContext = createContext<BillingPricingContextValue | null>(
  null
);

export function BillingPricingProvider({ children }: { children: ReactNode }) {
  const [interval, setInterval] = useState<BillingInterval>("monthly");

  const getQuote = useCallback(
    (plan: PaidPlanId) => getPlanPriceQuote(plan, interval),
    [interval]
  );

  const getButtonLabel = useCallback(
    (plan: PaidPlanId, baseLabel: string) => {
      const price = getCheckoutLabel(plan, interval);
      return `${baseLabel} — ${price}`;
    },
    [interval]
  );

  const value = useMemo(
    () => ({
      interval,
      setInterval,
      getQuote,
      getButtonLabel,
    }),
    [interval, getQuote, getButtonLabel]
  );

  return (
    <BillingPricingContext.Provider value={value}>
      {children}
    </BillingPricingContext.Provider>
  );
}

export function useBillingPricing(): BillingPricingContextValue {
  const context = useContext(BillingPricingContext);
  if (!context) {
    throw new Error("useBillingPricing must be used within BillingPricingProvider");
  }
  return context;
}
