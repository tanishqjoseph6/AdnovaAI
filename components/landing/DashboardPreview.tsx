"use client";

import { motion } from "framer-motion";
import { FREE_PLAN_CREDITS } from "@/lib/credits/constants";
import LandingSection from "@/components/landing/LandingSection";

const SIDEBAR_ITEMS = [
  "Dashboard",
  "Generate Ads",
  "Brand Kit",
  "Competitor Analyzer",
  "Landing Analyzer",
  "Social Scheduler",
  "History",
  "Billing",
];

export default function DashboardPreview() {
  return (
    <LandingSection
      id="dashboard"
      eyebrow="Workspace"
      title={
        <>
          Your creative <span className="gradient-text">command center</span>
        </>
      }
      description="Credits, generations, analyzers, and billing — unified in one premium dashboard built for daily use."
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.55 }}
        className="gradient-border animate-float mx-auto max-w-5xl overflow-hidden rounded-2xl shadow-2xl shadow-violet-500/15"
      >
        <div className="glass p-1">
          <div className="overflow-hidden rounded-xl bg-[#0a0618]">
            <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
              <span className="h-3 w-3 rounded-full bg-red-500/80" />
              <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
              <span className="h-3 w-3 rounded-full bg-green-500/80" />
              <span className="ml-4 text-xs text-zinc-500">useadvora.com/dashboard</span>
            </div>

            <div className="grid lg:grid-cols-[200px_1fr]">
              <aside className="hidden border-r border-white/5 p-4 lg:block">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                  Workspace
                </p>
                <ul className="mt-3 space-y-1">
                  {SIDEBAR_ITEMS.map((item, i) => (
                    <li
                      key={item}
                      className={`rounded-lg px-3 py-2 text-xs ${
                        i === 0
                          ? "bg-violet-500/15 font-medium text-violet-200"
                          : "text-zinc-500"
                      }`}
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </aside>

              <div className="space-y-4 p-4 sm:p-6">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    { label: "Plan", value: "Free" },
                    { label: "Credits", value: String(FREE_PLAN_CREDITS) },
                    { label: "This month", value: "12" },
                    { label: "Analyses", value: "3" },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4"
                    >
                      <p className="text-[10px] uppercase tracking-wider text-zinc-500">
                        {stat.label}
                      </p>
                      <p className="mt-1 text-xl font-semibold text-white">{stat.value}</p>
                    </div>
                  ))}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-cyan-400">
                      Recent generations
                    </p>
                    <ul className="mt-3 space-y-2 text-sm text-zinc-400">
                      <li className="rounded-lg bg-white/[0.03] px-3 py-2">
                        Wireless earbuds · 5 hooks
                      </li>
                      <li className="rounded-lg bg-white/[0.03] px-3 py-2">
                        Skincare serum · UGC script
                      </li>
                      <li className="rounded-lg bg-white/[0.03] px-3 py-2">
                        Competitor ad · Score 82
                      </li>
                    </ul>
                  </div>
                  <div className="rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 to-cyan-500/10 p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-fuchsia-400">
                      Quick actions
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {["Generate ads", "Analyze URL", "Brand Kit", "Schedule post"].map(
                        (action) => (
                          <span
                            key={action}
                            className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-zinc-300"
                          >
                            {action}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </LandingSection>
  );
}
