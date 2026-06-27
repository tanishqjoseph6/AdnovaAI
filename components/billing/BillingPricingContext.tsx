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
  type BillingCurrency,
  type BillingInterval,
  type PlanPriceQuote,
} from "@/lib/billing/pricing";

type BillingPricingContextValue = {
  interval: BillingInterval;
  currency: BillingCurrency;
  setInterval: (interval: BillingInterval) => void;
  setCurrency: (currency: BillingCurrency) => void;
  getQuote: (plan: PaidPlanId) => PlanPriceQuote;
  getButtonLabel: (plan: PaidPlanId, baseLabel: string) => string;
};

const BillingPricingContext = createContext<BillingPricingContextValue | null>(
  null
);

export function BillingPricingProvider({ children }: { children: ReactNode }) {
  const [interval, setInterval] = useState<BillingInterval>("monthly");
  const [currency, setCurrency] = useState<BillingCurrency>("INR");

  const getQuote = useCallback(
    (plan: PaidPlanId) => getPlanPriceQuote(plan, interval, currency),
    [interval, currency]
  );

  const getButtonLabel = useCallback(
    (plan: PaidPlanId, baseLabel: string) => {
      const price = getCheckoutLabel(plan, interval, currency);
      if (baseLabel.toLowerCase().includes("upgrade")) {
        return `${baseLabel} — ${price}`;
      }
      return `${baseLabel} — ${price}`;
    },
    [interval, currency]
  );

  const value = useMemo(
    () => ({
      interval,
      currency,
      setInterval,
      setCurrency,
      getQuote,
      getButtonLabel,
    }),
    [interval, currency, getQuote, getButtonLabel]
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
