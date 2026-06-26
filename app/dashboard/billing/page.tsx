import DashboardShell from "@/components/dashboard/DashboardShell";
import BillingHeroCard from "@/components/billing/BillingHeroCard";
import BillingHistoryTable from "@/components/billing/BillingHistoryTable";
import FeatureComparison from "@/components/billing/FeatureComparison";
import PaymentNotice from "@/components/billing/PaymentNotice";
import PricingPlanCards from "@/components/billing/PricingPlanCards";
import UpgradeProCta from "@/components/billing/UpgradeProCta";
import { buildBillingInvoices } from "@/lib/billing/invoices";
import { FREE_PLAN_CREDITS } from "@/lib/credits/constants";
import { getUserCreditsForUser } from "@/lib/credits/server";
import type { UserCredits } from "@/lib/credits/types";
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

const DEFAULT_CREDITS: UserCredits = {
  credits: FREE_PLAN_CREDITS,
  plan: "free",
  unlimited: false,
  maxCredits: FREE_PLAN_CREDITS,
  updatedAt: "1970-01-01T00:00:00.000Z",
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
        generations_used: 0,
      };

  let credits: UserCredits = DEFAULT_CREDITS;
  if (user) {
    try {
      credits = await getUserCreditsForUser(user.id, supabase);
    } catch {
      credits = DEFAULT_CREDITS;
    }
  }

  const invoices = buildBillingInvoices(subscription);

  return (
    <DashboardShell
      title="Billing"
      subtitle="Manage your plan, credits, and payment history"
    >
      <div className="space-y-10">
        <PaymentNotice payment={params.payment} message={params.message} />

        <BillingHeroCard subscription={subscription} credits={credits} />

        <PricingPlanCards currentPlanId={subscription.plan} />

        <UpgradeProCta currentPlanId={subscription.plan} />

        <FeatureComparison currentPlanId={subscription.plan} />

        <BillingHistoryTable invoices={invoices} />
      </div>
    </DashboardShell>
  );
}
