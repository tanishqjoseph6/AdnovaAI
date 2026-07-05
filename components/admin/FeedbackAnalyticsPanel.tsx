"use client";

import type { FeedbackAnalytics } from "@/lib/feedback/server";

type FeedbackAnalyticsPanelProps = {
  analytics: FeedbackAnalytics | null;
  isLoading: boolean;
};

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 backdrop-blur-xl sm:p-5">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white sm:text-3xl">{value}</p>
      {hint ? <p className="mt-1 text-xs text-zinc-600">{hint}</p> : null}
    </div>
  );
}

function BarChart({
  items,
}: {
  items: Array<{ label: string; percent: number; count: number }>;
}) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label}>
          <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
            <span className="truncate text-zinc-300">{item.label}</span>
            <span className="shrink-0 text-zinc-500">
              {item.percent}% ({item.count})
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 transition-all duration-500"
              style={{ width: `${Math.max(item.percent, item.count > 0 ? 4 : 0)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function FeedbackAnalyticsPanel({
  analytics,
  isLoading,
}: FeedbackAnalyticsPanelProps) {
  if (isLoading) {
    return (
      <div className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-8 text-center text-sm text-zinc-400">
        Loading feedback analytics...
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-white">Feedback analytics</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Ratings, reactions, and category trends across all submissions.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Average rating"
          value={analytics.averageRating > 0 ? `${analytics.averageRating} ★` : "—"}
        />
        <StatCard label="Total feedback" value={analytics.totalFeedback} />
        <StatCard
          label="Most selected reaction"
          value={analytics.mostSelectedReaction?.label ?? "—"}
          hint={
            analytics.mostSelectedReaction
              ? `${analytics.mostSelectedReaction.percent}% of reactions`
              : undefined
          }
        />
        <StatCard
          label="Top category"
          value={analytics.topCategory?.label ?? "—"}
          hint={
            analytics.topCategory
              ? `${analytics.topCategory.count} submissions`
              : undefined
          }
        />
        <StatCard label="Weekly feedback" value={analytics.weeklyFeedback} />
        <StatCard label="Monthly feedback" value={analytics.monthlyFeedback} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-5 backdrop-blur-xl">
          <h3 className="text-sm font-semibold text-white">Rating distribution</h3>
          <div className="mt-5">
            <BarChart
              items={analytics.ratingDistribution.map((item) => ({
                label: `${"★".repeat(item.rating)} ${item.label}`,
                percent: item.percent,
                count: item.count,
              }))}
            />
          </div>
        </div>

        <div className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-5 backdrop-blur-xl">
          <h3 className="text-sm font-semibold text-white">Reaction distribution</h3>
          <div className="mt-5">
            {analytics.reactionDistribution.length > 0 ? (
              <BarChart
                items={analytics.reactionDistribution.map((item) => ({
                  label: item.label,
                  percent: item.percent,
                  count: item.count,
                }))}
              />
            ) : (
              <p className="text-sm text-zinc-500">No reaction data yet.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
