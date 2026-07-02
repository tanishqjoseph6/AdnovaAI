"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Gift, Rocket, ShieldCheck, Sparkles, Wrench, X } from "lucide-react";
import { openFeedbackModal } from "@/components/dashboard/FeedbackLauncher";

const DISMISS_STORAGE_KEY = "advora-beta-banner-dismissed-at";
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

type Badge = {
  icon: typeof Rocket;
  title: string;
  description: string;
};

const BADGES: Badge[] = [
  {
    icon: Rocket,
    title: "Early Access",
    description: "Get new features before everyone else.",
  },
  {
    icon: Gift,
    title: "Beta Rewards",
    description: "Active beta users may receive bonus credits and exclusive perks.",
  },
  {
    icon: ShieldCheck,
    title: "Priority Support",
    description: "Your issues and feedback receive priority attention.",
  },
  {
    icon: Wrench,
    title: "Building in Public",
    description: "You are helping shape the future of Advora AI.",
  },
];

function shouldShowBanner(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const dismissedAt = window.localStorage.getItem(DISMISS_STORAGE_KEY);
  if (!dismissedAt) {
    return true;
  }

  const timestamp = Number(dismissedAt);
  if (!Number.isFinite(timestamp)) {
    window.localStorage.removeItem(DISMISS_STORAGE_KEY);
    return true;
  }

  return Date.now() - timestamp >= DISMISS_DURATION_MS;
}

export default function BetaLaunchBanner() {
  const [visible, setVisible] = useState(false);

  const badgeCards = useMemo(
    () =>
      BADGES.map((badge) => {
        const Icon = badge.icon;
        return (
          <div
            key={badge.title}
            className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 shadow-lg shadow-black/10 backdrop-blur-xl"
          >
            <div className="flex items-start gap-3">
              <span className="rounded-xl bg-gradient-to-br from-cyan-400/15 to-violet-500/15 p-2 text-cyan-300 ring-1 ring-white/10">
                <Icon className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-white">{badge.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                  {badge.description}
                </p>
              </div>
            </div>
          </div>
        );
      }),
    []
  );

  useEffect(() => {
    setVisible(shouldShowBanner());
  }, []);

  function dismissBanner() {
    window.localStorage.setItem(DISMISS_STORAGE_KEY, String(Date.now()));
    setVisible(false);
  }

  return (
    <AnimatePresence initial={false}>
      {visible && (
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-cyan-400/30 via-violet-500/25 to-fuchsia-500/30 p-px shadow-2xl shadow-violet-950/30"
        >
          <div className="relative rounded-[calc(2rem-1px)] border border-white/[0.08] bg-[#08021d]/90 p-5 backdrop-blur-2xl sm:p-6 lg:p-7">
            <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[calc(2rem-1px)]">
              <div className="absolute -left-24 -top-24 h-56 w-56 rounded-full bg-cyan-400/15 blur-3xl" />
              <div className="absolute -bottom-28 right-12 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl" />
            </div>

            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-stretch lg:justify-between">
              <div className="max-w-2xl">
                <div className="flex flex-wrap items-center gap-3 pr-16">
                  <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
                    <Sparkles className="h-3.5 w-3.5" />
                    Beta Launch
                  </span>
                  <span className="text-sm text-zinc-500">
                    Thanks for building with us.
                  </span>
                </div>

                <h2 className="mt-5 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  🚀 Welcome to Advora Beta
                </h2>
                <p className="mt-3 text-base font-medium text-zinc-200">
                  Thanks for helping us build the future of AI marketing.
                </p>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
                  Advora is currently in Beta. Your feedback helps us improve
                  the product faster. If you find any bugs or have feature
                  ideas, we&apos;d love to hear from you.
                </p>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => openFeedbackModal("bug_report")}
                    className="inline-flex items-center justify-center rounded-2xl border border-red-400/25 bg-red-400/10 px-5 py-3 text-sm font-semibold text-red-100 transition hover:border-red-300/40 hover:bg-red-400/15"
                  >
                    🐞 Report Bug
                  </button>
                  <button
                    type="button"
                    onClick={() => openFeedbackModal("general_feedback")}
                    className="inline-flex items-center justify-center rounded-2xl border border-cyan-400/25 bg-cyan-400/10 px-5 py-3 text-sm font-semibold text-cyan-100 transition hover:border-cyan-300/40 hover:bg-cyan-400/15"
                  >
                    💡 Send Feedback
                  </button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:w-[28rem]">
                {badgeCards}
              </div>
            </div>

            <div className="absolute right-4 top-4 flex items-center gap-2 sm:right-5 sm:top-5">
              <span className="rounded-full border border-violet-300/25 bg-violet-400/10 px-3 py-1 text-xs font-bold tracking-[0.18em] text-violet-100">
                BETA
              </span>
              <button
                type="button"
                onClick={dismissBanner}
                className="rounded-full border border-white/10 bg-white/[0.04] p-2 text-zinc-400 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
                aria-label="Dismiss beta launch banner"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
