import BillingPlanButton from "@/components/dashboard/BillingPlanButton";
import BillingCreditsProgress from "@/components/billing/BillingCreditsProgress";
import { getPlanHeroDescription } from "@/lib/billing/comparison";
import { PLANS } from "@/lib/billing/plans";
import { formatBillingPlanLabel } from "@/lib/billing/invoices";
import type { UserSubscription } from "@/lib/subscription";
import { isSubscriptionActive } from "@/lib/subscription";
import type { UserCredits } from "@/lib/credits/types";

type BillingHeroCardProps = {
  subscription: UserSubscription;
  credits: UserCredits;
};

function StatusBadge({
  subscription,
}: {
  subscription: UserSubscription;
}) {
  const isActive = isSubscriptionActive(subscription);

  if (isActive) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        Active
      </span>
    );
  }

  if (subscription.plan === "free") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-500/30 bg-zinc-500/10 px-3 py-1 text-xs font-medium text-zinc-300">
        Free tier
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300">
      Inactive
    </span>
  );
}

export default function BillingHeroCard({
  subscription,
  credits,
}: BillingHeroCardProps) {
  const currentPlan = PLANS[subscription.plan];
  const displayName = formatBillingPlanLabel(subscription.plan);
  const description = getPlanHeroDescription(subscription.plan);
  const showStarterUpgrade =
    subscription.plan !== "starter" && subscription.plan !== "pro";
  const showProUpgrade = subscription.plan !== "pro";

  return (
    <section className="relative mb-2">
      <div className="pointer-events-none absolute -left-20 top-0 h-56 w-56 rounded-full bg-violet-600/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-0 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl" />

      <div className="relative grid gap-5 lg:grid-cols-2 lg:gap-6">
        {/* Current plan card */}
        <article className="glass relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 shadow-lg shadow-black/20 backdrop-blur-sm sm:p-7">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-600/[0.07] via-transparent to-cyan-500/[0.05]" />

          <div className="relative flex flex-1 flex-col">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-400/90">
              Current plan
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                {displayName}
                {currentPlan.emoji ? ` ${currentPlan.emoji}` : ""}
              </h2>
              <StatusBadge subscription={subscription} />
            </div>

            <p className="mt-4 max-w-lg text-sm leading-relaxed text-zinc-400 sm:text-base">
              {description}
            </p>

            <p className="mt-3 text-sm font-medium text-zinc-500">
              {currentPlan.priceLabel}
            </p>

            <div className="my-6 h-px bg-white/[0.06]" />

            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              What&apos;s included
            </p>
            <ul className="mt-3 space-y-2.5">
              {currentPlan.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2.5 text-sm leading-relaxed text-zinc-300"
                >
                  <svg
                    className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400/90"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>

            {(showStarterUpgrade || showProUpgrade) && (
              <div className="mt-auto flex flex-col gap-3 pt-8 sm:flex-row sm:flex-wrap">
                {showStarterUpgrade && (
                  <BillingPlanButton
                    plan="starter"
                    disabled={false}
                    className="inline-flex items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-5 py-2.5 text-sm font-semibold text-cyan-200 transition hover:border-cyan-400/50 hover:bg-cyan-500/15 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Upgrade to Starter — ₹999
                  </BillingPlanButton>
                )}
                {showProUpgrade && (
                  <BillingPlanButton
                    plan="pro"
                    disabled={false}
                    className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Upgrade to Pro — ₹2,999
                  </BillingPlanButton>
                )}
              </div>
            )}
          </div>
        </article>

        {/* Remaining credits card */}
        <article className="glass relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 shadow-lg shadow-black/20 backdrop-blur-sm sm:p-7">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-cyan-500/[0.06] via-transparent to-violet-600/[0.06]" />

          <div className="relative flex flex-1 flex-col">
            <BillingCreditsProgress
              credits={credits.credits}
              maxCredits={credits.maxCredits}
              unlimited={credits.unlimited}
              embedded
            />

            <div className="mt-auto border-t border-white/[0.06] pt-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Usage tip
              </p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                {credits.unlimited
                  ? "Your Pro plan includes unlimited generations — create as many ads as you need."
                  : "Upgrade anytime to unlock more credits and faster generation speeds."}
              </p>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
