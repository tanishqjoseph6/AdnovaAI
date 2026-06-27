import DashboardShell from "@/components/dashboard/DashboardShell";
import BillingHeroCard from "@/components/billing/BillingHeroCard";
import BillingHistoryTable from "@/components/billing/BillingHistoryTable";
import BillingPricingShell from "@/components/billing/BillingPricingShell";
import FeatureComparison from "@/components/billing/FeatureComparison";
import PaymentNotice from "@/components/billing/PaymentNotice";
import PricingPlanCards from "@/components/billing/PricingPlanCards";
import UpgradeProCta from "@/components/billing/UpgradeProCta";
import { buildBillingInvoices } from "@/lib/billing/invoices";
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

  const invoices = buildBillingInvoices(subscription);

  return (
    <DashboardShell
      title="Billing"
      subtitle="Manage your plan, credits, and payment history"
    >
      <div className="space-y-10">
        <PaymentNotice payment={params.payment} message={params.message} />

        <BillingPricingShell>
          <BillingHeroCard subscription={subscription} />

          <PricingPlanCards currentPlanId={subscription.plan} />

          <UpgradeProCta currentPlanId={subscription.plan} />
        </BillingPricingShell>

        <FeatureComparison currentPlanId={subscription.plan} />

        <BillingHistoryTable invoices={invoices} />
      </div>
    </DashboardShell>
  );
}
