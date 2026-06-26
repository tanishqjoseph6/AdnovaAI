"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const ACTIONS = [
  {
    href: "/dashboard/generate",
    emoji: "✨",
    title: "Generate New Ad",
    description: "Create hooks, captions, CTAs and UGC scripts in seconds.",
    gradient: "from-cyan-500/25 via-violet-500/20 to-fuchsia-500/10",
    iconGradient: "from-cyan-400 to-violet-500",
  },
  {
    href: "/dashboard/history",
    emoji: "📜",
    title: "View History",
    description: "Browse, search and copy your past AI generations.",
    gradient: "from-violet-500/20 to-cyan-500/10",
    iconGradient: "from-violet-400 to-fuchsia-500",
  },
  {
    href: "/dashboard/billing",
    emoji: "💳",
    title: "Manage Billing",
    description: "Upgrade your plan and track credits usage.",
    gradient: "from-fuchsia-500/15 to-violet-500/10",
    iconGradient: "from-fuchsia-400 to-pink-500",
  },
  {
    href: "/dashboard/settings",
    emoji: "⚙",
    title: "Settings",
    description: "Update your profile and account preferences.",
    gradient: "from-cyan-500/15 to-emerald-500/10",
    iconGradient: "from-cyan-400 to-emerald-400",
  },
] as const;

export default function QuickActionCards() {
  return (
    <section>
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-400/90">
        Quick actions
      </p>
      <h2 className="mt-1 text-xl font-semibold tracking-tight text-white sm:text-2xl">
        Jump into your workflow
      </h2>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {ACTIONS.map((action, index) => (
          <motion.div
            key={action.href}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: index * 0.06 }}
          >
            <Link
              href={action.href}
              className={`group glass flex h-full flex-col rounded-2xl border border-white/[0.08] bg-gradient-to-br ${action.gradient} p-5 transition hover:border-white/[0.14] hover:shadow-lg hover:shadow-violet-500/10`}
            >
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${action.iconGradient} text-lg shadow-lg shadow-black/20 transition group-hover:scale-105`}
              >
                <span aria-hidden>{action.emoji}</span>
              </div>
              <h3 className="mt-4 text-base font-semibold text-white">
                {action.title}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-400">
                {action.description}
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-cyan-400 opacity-0 transition group-hover:opacity-100">
                Open
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </span>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
