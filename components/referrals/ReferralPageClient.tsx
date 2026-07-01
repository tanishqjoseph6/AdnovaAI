"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import CopyButton from "@/components/dashboard/CopyButton";
import type { ReferralServiceError, ReferralStats } from "@/lib/referrals/server";

type ReferralPageClientProps = {
  initialStats?: ReferralStats | null;
};

type ReferralApiResponse = {
  stats: ReferralStats | null;
  error: ReferralServiceError | null;
};

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent: "cyan" | "violet" | "emerald" | "fuchsia";
}) {
  const accents = {
    cyan: "from-cyan-500/20 to-cyan-500/5 text-cyan-300",
    violet: "from-violet-500/20 to-violet-500/5 text-violet-300",
    emerald: "from-emerald-500/20 to-emerald-500/5 text-emerald-300",
    fuchsia: "from-fuchsia-500/20 to-fuchsia-500/5 text-fuchsia-300",
  };

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
        {label}
      </p>
      <p
        className={`mt-3 inline-flex rounded-xl bg-gradient-to-br px-3 py-2 text-2xl font-semibold ${accents[accent]}`}
      >
        {value}
      </p>
    </div>
  );
}

export default function ReferralPageClient({
  initialStats = null,
}: ReferralPageClientProps) {
  const [stats, setStats] = useState<ReferralStats | null>(initialStats);
  const [error, setError] = useState<ReferralServiceError | null>(null);
  const [isLoading, setIsLoading] = useState(!initialStats);
  const [shareStatus, setShareStatus] = useState<string | null>(null);

  useEffect(() => {
    if (initialStats) {
      return;
    }

    let cancelled = false;

    async function loadReferralStats() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/referrals", {
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        const payload = (await response.json().catch(() => ({
          stats: null,
          error: {
            code: "unknown",
            message: "Referral rewards returned an invalid response.",
          },
        }))) as ReferralApiResponse;

        if (cancelled) {
          return;
        }

        if (!response.ok || payload.error) {
          setStats(null);
          setError(
            payload.error ?? {
              code: "unknown",
              message: "Unable to load referral rewards.",
            }
          );
          return;
        }

        setStats(payload.stats);
      } catch {
        if (!cancelled) {
          setStats(null);
          setError({
            code: "unknown",
            message: "Unable to load referral rewards.",
          });
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadReferralStats();

    return () => {
      cancelled = true;
    };
  }, [initialStats]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="glass animate-pulse rounded-3xl border border-white/[0.08] p-8">
          <div className="h-4 w-32 rounded-full bg-white/10" />
          <div className="mt-6 h-9 max-w-xl rounded-xl bg-white/10" />
          <div className="mt-4 h-4 max-w-2xl rounded-full bg-white/10" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-32 animate-pulse rounded-2xl border border-white/[0.08] bg-white/[0.03]"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass rounded-2xl border border-white/[0.08] p-8 text-center">
        <h2 className="text-xl font-semibold text-white">
          {error.code === "migration_required"
            ? "Referral setup is incomplete"
            : "Referrals are unavailable"}
        </h2>
        <p className="mt-2 text-sm text-zinc-500">
          {error.message}
        </p>
        {error.code === "migration_required" && (
          <p className="mx-auto mt-4 max-w-lg text-xs leading-relaxed text-zinc-600">
            Apply the latest Supabase migration, then refresh this page. The
            dashboard will return empty referrals and rewards automatically once
            the tables exist.
          </p>
        )}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="glass rounded-2xl border border-white/[0.08] p-8 text-center">
        <h2 className="text-xl font-semibold text-white">
          Referral rewards are loading
        </h2>
        <p className="mt-2 text-sm text-zinc-500">
          Refresh this page if it does not update.
        </p>
      </div>
    );
  }

  const loadedStats = stats;
  const progress = Math.min(loadedStats.successfulReferrals, 10);
  const progressPercent = (progress / 10) * 100;

  async function handleShare() {
    setShareStatus(null);
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Try Advora AI",
          text: "Create high-converting AI ads with Advora AI.",
          url: loadedStats.referralLink,
        });
        setShareStatus("Referral link shared.");
        return;
      } catch {
        // User cancelled or share failed; fall back to copy guidance.
      }
    }

    try {
      await navigator.clipboard.writeText(loadedStats.referralLink);
      setShareStatus("Referral link copied.");
    } catch {
      setShareStatus("Copy the link manually to share.");
    }
  }

  return (
    <div className="space-y-8">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="glass relative overflow-hidden rounded-3xl border border-white/[0.08] p-5 shadow-2xl shadow-black/20 sm:p-8"
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="relative grid gap-6 lg:grid-cols-[1fr_22rem] lg:items-center">
          <div>
            <div className="mb-4 inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-200">
              Referral Rewards
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-4xl">
              Invite creators. Earn credits. Unlock Starter.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
              A referral becomes successful only after your friend verifies email,
              enters the dashboard, and generates their first AI ad.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Your referral link
            </p>
            <div className="mt-3 break-all rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-zinc-200">
              {loadedStats.referralLink}
            </div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <CopyButton
                text={loadedStats.referralLink}
                label="Copy link"
                className="w-full sm:w-auto"
              />
              <button
                type="button"
                onClick={() => void handleShare()}
                className="inline-flex w-full items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white sm:w-auto"
              >
                Share
              </button>
            </div>
            {shareStatus && (
              <p className="mt-3 text-xs text-emerald-300" role="status">
                {shareStatus}
              </p>
            )}
          </div>
        </div>
      </motion.section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total referrals" value={loadedStats.totalReferrals} accent="cyan" />
        <StatCard label="Pending" value={loadedStats.pendingReferrals} accent="violet" />
        <StatCard label="Successful" value={loadedStats.successfulReferrals} accent="emerald" />
        <StatCard label="Credits earned" value={loadedStats.creditsEarned} accent="fuchsia" />
      </div>

      <section className="glass rounded-2xl border border-white/[0.08] p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Starter reward progress
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              {progress}/10 successful referrals toward 1 free Starter month.
            </p>
          </div>
          {loadedStats.starterUnlocked && (
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
              Starter unlocked
            </span>
          )}
        </div>
        <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        {loadedStats.starterExpiresAt && (
          <p className="mt-3 text-sm text-emerald-300">
            Free Starter expires on{" "}
            {new Date(loadedStats.starterExpiresAt).toLocaleDateString()}.
          </p>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="glass rounded-2xl border border-white/[0.08] p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-white">Reward history</h2>
          <div className="mt-4 space-y-3">
            {loadedStats.rewards.length ? (
              loadedStats.rewards.map((reward) => (
                <div
                  key={reward.id}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3"
                >
                  <p className="text-sm font-medium text-white">
                    {reward.description}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {new Date(reward.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-zinc-500">
                Rewards will appear after a referred friend completes their first ad.
              </p>
            )}
          </div>
        </section>

        <section className="glass rounded-2xl border border-white/[0.08] p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-white">Referral activity</h2>
          <div className="mt-4 space-y-3">
            {loadedStats.referrals.length ? (
              loadedStats.referrals.map((referral) => (
                <div
                  key={referral.id}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium text-white">
                      {referral.referredEmail}
                    </p>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        referral.status === "successful"
                          ? "bg-emerald-500/10 text-emerald-300"
                          : referral.status === "blocked"
                            ? "bg-red-500/10 text-red-300"
                            : "bg-violet-500/10 text-violet-300"
                      }`}
                    >
                      {referral.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">
                    Joined {new Date(referral.signupAt).toLocaleDateString()}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-zinc-500">
                No referrals yet. Share your link to get started.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
