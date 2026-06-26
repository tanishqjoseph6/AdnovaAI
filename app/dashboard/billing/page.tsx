import DashboardShell from "@/components/dashboard/DashboardShell";
import BillingPlanButton from "@/components/dashboard/BillingPlanButton";
import { getPlan, PLANS } from "@/lib/billing/plans";
import {
  ensureUserProfile,
  getUserSubscription,
  isSubscriptionActive,
} from "@/lib/subscription";
import { createClient } from "@/lib/supabase/server";

type BillingPageProps = {
  searchParams: Promise<{
    payment?: string;
    message?: string;
  }>;
};

function PaymentNotice({
  payment,
  message,
}: {
  payment?: string;
  message?: string;
}) {
  if (!payment) {
    return null;
  }

  if (payment === "success") {
    return (
      <div
        role="status"
        className="rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-300"
      >
        Payment successful. Your subscription is now active.
      </div>
    );
  }

  const text =
    message ??
    (payment === "cancelled"
      ? "Payment was cancelled. You can try again anytime."
      : "Payment failed. Please try again.");

  return (
    <div
      role="alert"
      className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
    >
      {text}
    </div>
  );
}

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

  const currentPlan = getPlan(subscription.plan);
  const isActive = isSubscriptionActive(subscription);

  return (
    <DashboardShell
      title="Billing"
      subtitle="Manage your AdvoraAI subscription"
    >
      <div className="space-y-6">
        <PaymentNotice payment={params.payment} message={params.message} />

        {/* Current Plan */}
        <section className="gradient-border rounded-2xl bg-[#0a0618] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-500">Current Plan</p>
              <h2 className="mt-1 text-2xl font-bold text-white">
                {currentPlan.name}
                {currentPlan.emoji ? ` ${currentPlan.emoji}` : ""}
              </h2>
              <p className="mt-2 text-sm text-zinc-400">
                {currentPlan.priceLabel}
              </p>
            </div>

            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                isActive
                  ? "bg-green-500/20 text-green-300"
                  : "bg-white/10 text-zinc-400"
              }`}
            >
              {isActive ? "Active" : subscription.plan === "free" ? "Free" : "Inactive"}
            </span>
          </div>

          <div className="mt-6 space-y-2 text-sm text-zinc-400">
            {currentPlan.features.map((feature) => (
              <p key={feature}>✅ {feature}</p>
            ))}
          </div>

          <div className="mt-6 space-y-3">
            <BillingPlanButton
              plan="starter"
              disabled={subscription.plan === "starter" || subscription.plan === "pro"}
              className="block w-full rounded-xl bg-blue-600 py-3 text-center font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Upgrade to Starter 🚀 ₹999
            </BillingPlanButton>

            <BillingPlanButton
              plan="pro"
              disabled={subscription.plan === "pro"}
              className="block w-full rounded-xl bg-purple-600 py-3 text-center font-medium text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Upgrade to Pro 👑 ₹2999
            </BillingPlanButton>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="glass rounded-2xl p-6">
          <h3 className="text-2xl font-bold text-white">Available Plans</h3>

          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {/* Starter */}
            <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-6 transition-all duration-300 hover:border-cyan-400 hover:shadow-lg hover:shadow-cyan-500/20">
              🚀 Starter
              <span className="inline-block rounded-full bg-cyan-500/20 px-3 py-1 text-xs font-bold text-cyan-300">
                BEST FOR BEGINNERS
              </span>

              <p className="mt-3 text-5xl font-bold text-cyan-300">₹999</p>

              <p className="text-zinc-400">per month</p>

              <ul className="mt-6 space-y-2 text-zinc-300">
                {PLANS.starter.features.map((feature) => (
                  <li key={feature}>✅ {feature}</li>
                ))}
              </ul>

              <BillingPlanButton
                plan="starter"
                disabled={subscription.plan === "starter" || subscription.plan === "pro"}
                className="mt-6 block w-full rounded-xl bg-cyan-500 py-3 text-center font-semibold text-white hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Get Starter
              </BillingPlanButton>
            </div>

            {/* Pro */}
            <div className="relative scale-105 rounded-3xl border-2 border-violet-400 bg-gradient-to-b from-violet-500/20 to-pink-500/10 p-6 shadow-2xl shadow-violet-500/40">
              <span className="inline-block rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 px-4 py-1 text-xs font-bold text-black shadow-lg">
                🔥 MOST POPULAR
              </span>

              <h3 className="mt-4 text-xl font-bold text-white">👑 Pro</h3>

              <p className="mt-3 text-4xl font-bold text-white">₹2999</p>

              <p className="text-zinc-400">per month</p>

              <ul className="mt-6 space-y-2 text-zinc-300">
                {PLANS.pro.features.map((feature) => (
                  <li key={feature}>✅ {feature}</li>
                ))}
              </ul>

              <BillingPlanButton
                plan="pro"
                disabled={subscription.plan === "pro"}
                className="mt-6 block w-full rounded-xl bg-gradient-to-r from-violet-500 to-pink-500 py-3 text-center font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Upgrade to Pro
              </BillingPlanButton>
            </div>

            {/* Custom */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h3 className="text-xl font-bold text-white">💎 Custom</h3>

              <p className="mt-3 text-4xl font-bold text-white">Custom</p>

              <p className="text-zinc-400">Contact Sales</p>

              <p className="mt-2 text-xs text-cyan-400">
                Best for agencies and growing brands
              </p>

              <ul className="mt-6 space-y-2 text-zinc-300">
                {PLANS.custom.features.map((feature) => (
                  <li key={feature}>✅ {feature}</li>
                ))}
              </ul>

              <button
                type="button"
                disabled
                className="mt-6 block w-full cursor-not-allowed rounded-xl border border-cyan-500/30 py-3 text-center font-semibold text-zinc-500 opacity-60"
              >
                💎 Coming Soon
              </button>
            </div>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
