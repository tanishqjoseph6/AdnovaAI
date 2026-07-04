"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Minus, Sparkles } from "lucide-react";
import { BILLING_COMPARISON_FEATURES } from "@/lib/billing/comparison";
import type { ComparisonValue } from "@/lib/billing/comparison";
import { PLANS } from "@/lib/billing/plans";
import type { PlanId } from "@/lib/billing/plans";

const DISPLAY_PLANS = ["free", "starter", "pro"] as const;

const LANDING_COMPARISON_ROWS = BILLING_COMPARISON_FEATURES.filter(
  (row) => row.label !== "Team access" && row.label !== "Dedicated support"
);

function ComparisonCell({ value }: { value: ComparisonValue }) {
  if (value === true) {
    return (
      <span className="inline-flex items-center justify-center">
        <Check className="h-4 w-4 text-cyan-400" aria-label="Included" />
      </span>
    );
  }

  if (value === false) {
    return (
      <span className="inline-flex items-center justify-center text-zinc-600">
        <Minus className="h-4 w-4" aria-label="Not included" />
      </span>
    );
  }

  return <span className="text-sm font-medium text-zinc-200">{value}</span>;
}

export default function LandingPricing() {
  return (
    <section
      id="pricing"
      className="relative overflow-hidden pt-14 pb-16 md:pt-20 md:pb-20"
    >
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[420px] w-[min(100%,720px)] -translate-x-1/2 rounded-full bg-violet-600/20 blur-[120px] animate-pulse-glow" />
        <div className="absolute bottom-0 left-1/4 h-[280px] w-[480px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[100px] animate-pulse-glow [animation-delay:1.5s]" />
        <div
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent"
          aria-hidden
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.4 }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-[11px] font-medium tracking-wide text-zinc-400">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" aria-hidden />
            Trusted by creators, startups and D2C brands
          </p>

          <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-400">
            Pricing
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white md:text-4xl">
            Simple plans that{" "}
            <span className="gradient-text">scale with you</span>
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400 sm:text-base">
            Start free. Upgrade when you&apos;re ready. Every plan includes the
            full Advora creative toolkit.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-5 lg:grid-cols-3 lg:gap-6">
          {DISPLAY_PLANS.map((planId, index) => {
            const plan = PLANS[planId];
            const highlighted = planId === "pro";

            return (
              <motion.article
                key={planId}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: index * 0.06, duration: 0.4 }}
                className={`relative flex flex-col rounded-2xl border p-7 sm:p-8 md:p-9 ${
                  highlighted
                    ? "billing-pro-card gradient-border z-10 border-transparent bg-[#0a0618] lg:-my-2 lg:py-10"
                    : "glass border-white/[0.08]"
                }`}
              >
                {highlighted ? (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                    Most popular
                  </span>
                ) : null}
                {planId === "starter" ? (
                  <span className="absolute -top-3 right-4 rounded-full border border-white/10 bg-[#0a0618] px-3 py-0.5 text-[10px] font-medium text-zinc-400">
                    Best value
                  </span>
                ) : null}

                <div className="flex items-center gap-2">
                  {plan.emoji ? (
                    <span className="text-2xl" aria-hidden>
                      {plan.emoji}
                    </span>
                  ) : null}
                  <h3 className="text-xl font-semibold text-white md:text-2xl">
                    {plan.name}
                  </h3>
                </div>

                <div className="mt-5 flex items-baseline gap-1.5">
                  <span className="text-4xl font-bold tracking-tight text-white md:text-5xl">
                    {plan.priceInr === 0 ? "Free" : `₹${plan.priceInr}`}
                  </span>
                  {plan.priceInr > 0 ? (
                    <span className="text-sm text-zinc-500">/month</span>
                  ) : null}
                </div>

                <ul className="mt-6 flex-1 space-y-3.5">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex gap-2.5 text-sm leading-snug text-zinc-400"
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  href={planId === "free" ? "/signup" : "/dashboard/billing"}
                  className={`mt-8 block rounded-xl py-3.5 text-center text-sm font-semibold transition ${
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

        {/* Comparison table */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mt-10 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm"
        >
          <p className="table-scroll-hint px-4 pt-4 sm:hidden">
            Swipe to compare plans →
          </p>
          <div className="table-scroll-container overflow-x-auto">
            <table className="w-full min-w-[540px] border-collapse text-left">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="px-5 py-4 text-xs font-medium uppercase tracking-wider text-zinc-500 sm:px-6">
                    What&apos;s included
                  </th>
                  {DISPLAY_PLANS.map((planId) => (
                    <th
                      key={planId}
                      className="px-4 py-4 text-center text-sm font-semibold text-white sm:px-6"
                    >
                      {PLANS[planId].name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {LANDING_COMPARISON_ROWS.map((row, rowIndex) => (
                  <tr
                    key={row.label}
                    className={
                      rowIndex < LANDING_COMPARISON_ROWS.length - 1
                        ? "border-b border-white/[0.04]"
                        : ""
                    }
                  >
                    <td className="px-5 py-3.5 text-sm text-zinc-400 sm:px-6">
                      {row.label}
                    </td>
                    {DISPLAY_PLANS.map((planId) => (
                      <td
                        key={`${row.label}-${planId}`}
                        className="px-4 py-3.5 text-center sm:px-6"
                      >
                        <ComparisonCell
                          value={row.values[planId as PlanId]}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
