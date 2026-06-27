"use client";

import { BillingPricingProvider } from "@/components/billing/BillingPricingContext";
import { BillingToastProvider } from "@/components/billing/BillingToast";
import BillingPaymentToasts from "@/components/billing/BillingPaymentToasts";

type BillingPricingShellProps = {
  children: React.ReactNode;
  payment?: string;
  message?: string;
};

export default function BillingPricingShell({
  children,
  payment,
  message,
}: BillingPricingShellProps) {
  return (
    <BillingToastProvider>
      <BillingPricingProvider>
        <BillingPaymentToasts payment={payment} message={message} />
        <div className="space-y-10">{children}</div>
      </BillingPricingProvider>
    </BillingToastProvider>
  );
}
