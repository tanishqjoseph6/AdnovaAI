"use client";

import { useEffect, useMemo, useState } from "react";

type Overview = {
  kpis?: Record<string, number>;
  recentPayments?: Array<Record<string, string | number | null>>;
  recentFeedback?: Array<Record<string, string | null>>;
  recentSignups?: Array<Record<string, string | null>>;
  systemHealth?: Record<string, string>;
  activity?: Array<Record<string, string | null>>;
  error?: string;
};

const KPI_LABELS: Record<string, string> = {
  totalUsers: "Total Users",
  activeUsers: "Active Users",
  todaysSignups: "Today's Signups",
  totalPaidUsers: "Total Paid Users",
  freeUsers: "Free Users",
  monthlyRevenue: "Monthly Revenue",
  mrr: "MRR",
  creditsUsedToday: "Credits Used Today",
  totalFeedback: "Total Feedback",
  openTickets: "Open Tickets",
  resolvedTickets: "Resolved Tickets",
};

function formatValue(key: string, value: number) {
  if (key === "monthlyRevenue" || key === "mrr") return `₹${value.toLocaleString("en-IN")}`;
  return value.toLocaleString("en-IN");
}

export default function AdminDashboardPageClient() {
  const [data, setData] = useState<Overview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const response = await fetch("/api/admin/overview", { cache: "no-store" });
        const payload = (await response.json().catch(() => ({}))) as Overview;
        if (!response.ok) throw new Error(payload.error ?? "Unable to load admin dashboard.");
        setData(payload);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load admin dashboard.");
      } finally {
        setIsLoading(false);
      }
    }
    void load();
  }, []);

  const kpis = useMemo(() => Object.entries(data?.kpis ?? {}), [data]);

  if (isLoading) {
    return <div className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-8 text-sm text-zinc-400">Loading admin dashboard...</div>;
  }

  if (error) {
    return <div className="rounded-3xl border border-red-400/20 bg-red-400/10 p-6 text-sm text-red-200">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map(([key, value]) => (
          <div key={key} className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-5 shadow-xl shadow-black/10 backdrop-blur-xl">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">{KPI_LABELS[key] ?? key}</p>
            <p className="mt-3 text-3xl font-semibold text-white">{formatValue(key, value)}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <AdminList title="Recent Payments" items={data?.recentPayments ?? []} primary="email" secondary="plan" meta="date" />
        <AdminList title="Recent Feedback" items={data?.recentFeedback ?? []} primary="subject" secondary="status" meta="date" />
        <AdminList title="Recent Signups" items={data?.recentSignups ?? []} primary="email" secondary="plan" meta="date" />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-5 backdrop-blur-xl">
          <h2 className="text-lg font-semibold text-white">System Health</h2>
          <div className="mt-4 space-y-3">
            {Object.entries(data?.systemHealth ?? {}).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between rounded-2xl bg-white/[0.03] px-4 py-3">
                <span className="capitalize text-zinc-400">{key}</span>
                <span className="text-sm font-medium text-emerald-300">{value}</span>
              </div>
            ))}
          </div>
        </div>
        <AdminList title="Recent Activity Timeline" items={data?.activity ?? []} primary="action" secondary="admin" meta="date" />
      </section>
    </div>
  );
}

function AdminList({
  title,
  items,
  primary,
  secondary,
  meta,
}: {
  title: string;
  items: Array<Record<string, string | number | null>>;
  primary: string;
  secondary: string;
  meta: string;
}) {
  return (
    <div className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-5 backdrop-blur-xl">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <div className="mt-4 space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-zinc-500">No records yet.</p>
        ) : (
          items.map((item, index) => (
            <div key={`${title}-${index}`} className="rounded-2xl bg-white/[0.03] px-4 py-3">
              <p className="truncate text-sm font-medium text-white">{String(item[primary] ?? "Untitled")}</p>
              <p className="mt-1 truncate text-xs text-zinc-500">{String(item[secondary] ?? "")}</p>
              <p className="mt-2 text-[11px] text-zinc-600">{String(item[meta] ?? "")}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
