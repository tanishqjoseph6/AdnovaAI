import DashboardShell from "@/components/dashboard/DashboardShell";
import BillingHeroCard from "@/components/billing/BillingHeroCard";
import BillingHistoryTable from "@/components/billing/BillingHistoryTable";
import BillingPricingShell from "@/components/billing/BillingPricingShell";
import FeatureComparison from "@/components/billing/FeatureComparison";
import PaymentNotice from "@/components/billing/PaymentNotice";
import PricingPlanCards from "@/components/billing/PricingPlanCards";
import BillingTrustSection from "@/components/billing/BillingTrustSection";
import BillingFaq from "@/components/billing/BillingFaq";
import UpgradeProCta from "@/components/billing/UpgradeProCta";
import {
  buildBillingInvoices,
  buildBillingInvoicesFromPayments,
} from "@/lib/billing/invoices";
import {
  normalizePaymentRow,
  paymentFromRow,
} from "@/lib/billing/payments";
import {
  ensureUserProfile,
  getUserSubscription,
} from "@/lib/subscription";
import { createClient } from "@/lib/supabase/server";

type BillingPageProps = {
  searchParams: Promise<{
    payment?: string;
    message?: string;
  }>;
};

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const subscription = user
    ? await ensureUserProfile(user.id, user.email, supabase).then(() =>
        getUserSubscription(user.id)
      )
    : {
        plan: "free" as const,
        payment_id: null,
        subscription_status: "inactive" as const,
        purchase_date: null,
      };

  let invoices = buildBillingInvoices(subscription);

  if (user) {
    const { data: paymentRows, error } = await supabase
      .from("payments")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "success")
      .order("created_at", { ascending: false })
      .limit(5);

    if (!error && paymentRows && paymentRows.length > 0) {
      const payments = paymentRows
        .map((row) => normalizePaymentRow(row as Record<string, unknown>))
        .filter((row): row is NonNullable<typeof row> => row !== null)
        .map(paymentFromRow);

      invoices = buildBillingInvoicesFromPayments(payments);
    }
  }

  return (
    <DashboardShell
      title="Billing"
      subtitle="Manage your plan, credits, and payment history"
    >
      <div className="space-y-10">
        <PaymentNotice payment={params.payment} message={params.message} />

        <BillingPricingShell
          payment={params.payment}
          message={params.message}
        >
          <BillingHeroCard subscription={subscription} />

          <PricingPlanCards currentPlanId={subscription.plan} />

          <BillingTrustSection />

          <BillingFaq />

          <UpgradeProCta currentPlanId={subscription.plan} />
        </BillingPricingShell>

        <FeatureComparison currentPlanId={subscription.plan} />

        <BillingHistoryTable invoices={invoices} />
      </div>
    </DashboardShell>
  );
}
