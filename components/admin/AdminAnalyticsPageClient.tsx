"use client";

import { useEffect, useState } from "react";

type SeriesPoint = { day?: string; label?: string; value: number };
type Analytics = Record<string, SeriesPoint[] | string | undefined> & { error?: string };

const CHARTS = [
  ["usersGrowth", "Users Growth"],
  ["revenue", "Revenue"],
  ["mrr", "MRR"],
  ["creditsUsage", "Credits Usage"],
  ["topPlans", "Top Plans"],
  ["topCountries", "Top Countries"],
  ["feedbackTrend", "Feedback Trend"],
] as const;

export default function AdminAnalyticsPageClient() {
  const [data, setData] = useState<Analytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      const response = await fetch("/api/admin/analytics", { cache: "no-store" });
      const payload = (await response.json().catch(() => ({}))) as Analytics;
      setData(response.ok ? payload : { error: payload.error ?? "Unable to load analytics." });
      setIsLoading(false);
    }
    void load();
  }, []);

  if (isLoading) return <div className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-8 text-sm text-zinc-400">Loading analytics...</div>;
  if (data?.error) return <div className="rounded-3xl border border-red-400/20 bg-red-400/10 p-6 text-sm text-red-200">{data.error}</div>;

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      {CHARTS.map(([key, title]) => (
        <ChartCard key={key} title={title} data={(data?.[key] as SeriesPoint[]) ?? []} />
      ))}
    </div>
  );
}

function ChartCard({ title, data }: { title: string; data: SeriesPoint[] }) {
  const max = Math.max(1, ...data.map((point) => point.value));
  return (
    <section className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-5 backdrop-blur-xl">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <div className="mt-5 flex h-44 items-end gap-1">
        {data.length === 0 ? (
          <p className="self-center text-sm text-zinc-500">No data yet.</p>
        ) : (
          data.map((point, index) => (
            <div key={`${title}-${index}`} className="flex flex-1 flex-col items-center gap-2">
              <div className="w-full rounded-t bg-gradient-to-t from-violet-500 to-cyan-400" style={{ height: `${Math.max(4, (point.value / max) * 160)}px` }} title={`${point.label ?? point.day}: ${point.value}`} />
            </div>
          ))
        )}
      </div>
    </section>
  );
}
