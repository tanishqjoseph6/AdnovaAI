import { getPlan, type PlanId, type SubscriptionStatus } from "./plans";
import type { UserSubscription } from "@/lib/subscription";
import {
  formatPaymentAmount,
  paymentInvoiceLabel,
  type PaymentRecord,
} from "@/lib/billing/payments";

export type BillingInvoice = {
  id: string;
  invoiceLabel: string;
  dateIso: string;
  planName: string;
  amountLabel: string;
  paymentStatus: "Paid" | "Pending" | "Failed" | "Cancelled" | "Refunded";
  subscriptionStatus?: SubscriptionStatus;
};

function mapPaymentStatus(
  status: PaymentRecord["status"]
): BillingInvoice["paymentStatus"] {
  if (status === "success") return "Paid";
  if (status === "failed") return "Failed";
  return "Refunded";
}

function mapSubscriptionPaymentStatus(
  subscriptionStatus: SubscriptionStatus,
  hasPayment: boolean
): BillingInvoice["paymentStatus"] {
  if (!hasPayment) {
    return "Pending";
  }
  if (subscriptionStatus === "cancelled") {
    return "Cancelled";
  }
  if (subscriptionStatus === "past_due") {
    return "Failed";
  }
  if (subscriptionStatus === "active") {
    return "Paid";
  }
  return "Pending";
}

export function buildBillingInvoicesFromPayments(
  payments: PaymentRecord[]
): BillingInvoice[] {
  return payments
    .filter((payment) => payment.status === "success")
    .map((payment) => ({
      id: payment.id,
      invoiceLabel: paymentInvoiceLabel(payment),
      dateIso: payment.createdAt,
      planName: getPlan(payment.plan).name,
      amountLabel: formatPaymentAmount(payment.amount, payment.currency),
      paymentStatus: mapPaymentStatus(payment.status),
    }));
}

export function buildBillingInvoices(
  subscription: UserSubscription
): BillingInvoice[] {
  if (!subscription.payment_id || !subscription.purchase_date) {
    return [];
  }

  const plan = getPlan(subscription.plan);

  return [
    {
      id: subscription.payment_id,
      invoiceLabel: `INV-${subscription.payment_id.slice(-8).toUpperCase()}`,
      dateIso: subscription.purchase_date,
      planName: plan.name,
      amountLabel:
        plan.priceInr !== null && plan.priceInr > 0
          ? `₹${plan.priceInr.toLocaleString("en-IN")}`
          : plan.priceLabel,
      paymentStatus: mapSubscriptionPaymentStatus(
        subscription.subscription_status,
        Boolean(subscription.payment_id)
      ),
      subscriptionStatus: subscription.subscription_status,
    },
  ];
}

export function formatBillingPlanLabel(planId: PlanId): string {
  if (planId === "custom") {
    return "Business";
  }
  return getPlan(planId).name;
}
