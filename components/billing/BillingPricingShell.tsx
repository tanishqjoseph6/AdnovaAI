"use client";

import { BillingPricingProvider } from "@/components/billing/BillingPricingContext";
import PricingToggles from "@/components/billing/PricingToggles";

export default function BillingPricingShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BillingPricingProvider>
      <div className="space-y-8">
        <PricingToggles />
        {children}
      </div>
    </BillingPricingProvider>
  );
}
