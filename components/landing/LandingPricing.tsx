"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import LandingSection from "@/components/landing/LandingSection";
import { PLANS } from "@/lib/billing/plans";

const DISPLAY_PLANS = ["free", "starter", "pro"] as const;

export default function LandingPricing() {
  return (
    <LandingSection
      id="pricing"
      eyebrow="Pricing"
      title={
        <>
          Simple plans that <span className="gradient-text">scale with you</span>
        </>
      }
      description="Start free. Upgrade when you're ready. All plans include the full Advora creative toolkit."
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {DISPLAY_PLANS.map((planId, index) => {
          const plan = PLANS[planId];
          const highlighted = planId === "pro";

          return (
            <motion.article
              key={planId}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              className={`relative flex flex-col rounded-2xl border p-6 sm:p-8 ${
                highlighted
                  ? "billing-pro-card gradient-border border-transparent bg-[#0a0618] shadow-xl shadow-violet-500/20"
                  : "glass border-white/[0.08]"
              }`}
            >
              {highlighted ? (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                  Most popular
                </span>
              ) : null}
              {planId === "starter" ? (
                <span className="absolute -top-3 right-4 rounded-full border border-white/10 bg-white/5 px-3 py-0.5 text-[10px] font-medium text-zinc-400">
                  Best value
                </span>
              ) : null}

              <div className="flex items-center gap-2">
                {plan.emoji ? <span className="text-xl">{plan.emoji}</span> : null}
                <h3 className="text-xl font-semibold text-white">{plan.name}</h3>
              </div>

              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white">
                  {plan.priceInr === 0 ? "Free" : `₹${plan.priceInr}`}
                </span>
                {plan.priceInr > 0 ? (
                  <span className="text-sm text-zinc-500">/month</span>
                ) : null}
              </div>

              <ul className="mt-6 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2 text-sm text-zinc-400">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href={planId === "free" ? "/signup" : "/dashboard/billing"}
                className={`mt-8 block rounded-xl py-3 text-center text-sm font-semibold transition ${
                  highlighted
                    ? "bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 text-white hover:opacity-90"
                    : "border border-white/15 bg-white/[0.04] text-white hover:bg-white/[0.08]"
                }`}
              >
                {planId === "free" ? "Start free" : `Get ${plan.name}`}
              </Link>
            </motion.article>
          );
        })}
      </div>
    </LandingSection>
  );
}
