import Link from "next/link";
import DashboardShell from "@/components/dashboard/DashboardShell";
import AdGeneratorSection from "@/components/dashboard/AdGeneratorSection";
import RecentAdsList from "@/components/dashboard/RecentAdsList";
import StatCard from "@/components/dashboard/StatCard";

const recentAds = [
  {
    name: "Wireless Earbuds — Meta",
    platform: "Meta",
    status: "Live",
    ctr: "4.2%",
    date: "2 hours ago",
  },
  {
    name: "SaaS Trial — Google",
    platform: "Google",
    status: "Draft",
    ctr: "—",
    date: "5 hours ago",
  },
  {
    name: "Fitness App — TikTok",
    platform: "TikTok",
    status: "Live",
    ctr: "6.1%",
    date: "Yesterday",
  },
  {
    name: "Skincare Bundle — Meta",
    platform: "Meta",
    status: "Paused",
    ctr: "2.8%",
    date: "2 days ago",
  },
];

const chartData = [
  { height: 40, label: "Jan" },
  { height: 65, label: "Feb" },
  { height: 45, label: "Mar" },
  { height: 80, label: "Apr" },
  { height: 55, label: "May" },
  { height: 90, label: "Jun" },
  { height: 70, label: "Jul" },
  { height: 85, label: "Aug" },
  { height: 60, label: "Sep" },
  { height: 95, label: "Oct" },
  { height: 75, label: "Nov" },
  { height: 88, label: "Dec" },
];

export default function DashboardPage() {
  return (
    <DashboardShell
      title="Dashboard"
      subtitle="Overview of your ad performance and AI activity"
    >
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm text-zinc-500">Welcome back,</p>
          <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl lg:text-3xl">
            Your <span className="gradient-text">creative command center</span>
          </h2>
        </div>
        <Link
          href="/dashboard/generate"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:opacity-90 md:hidden"
        >
          Generate ad
        </Link>
      </div>

      <div className="mb-8">
        <AdGeneratorSection />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Ads generated this month"
          value="1,284"
          change="+18%"
          accent="cyan"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          }
        />
        <StatCard
          label="Avg. predicted CTR"
          value="4.8%"
          change="+0.6%"
          accent="violet"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
            </svg>
          }
        />
        <StatCard
          label="Active campaigns"
          value="24"
          change="+3"
          accent="fuchsia"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
            </svg>
          }
        />
        <StatCard
          label="Credits remaining"
          value="100"
          change="-32"
          positive={false}
          accent="emerald"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
            </svg>
          }
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="glass min-w-0 rounded-2xl p-4 sm:p-6 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-white">Generation activity</h3>
              <p className="text-sm text-zinc-500">Last 12 weeks</p>
            </div>
            <select
              aria-label="Filter by platform"
              className="w-full max-w-[200px] rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm text-zinc-300 outline-none sm:w-auto"
            >
              <option>All platforms</option>
              <option>Meta</option>
              <option>Google</option>
              <option>TikTok</option>
            </select>
          </div>
          <div className="mt-6 flex h-40 items-end justify-between gap-1 sm:h-48 sm:gap-2">
            {chartData.map((bar) => (
              <div
                key={bar.label}
                className="flex min-w-0 flex-1 flex-col items-center gap-1 sm:gap-2"
              >
                <div
                  className="w-full min-w-[4px] rounded-t-md bg-gradient-to-t from-violet-600/80 to-cyan-400/80"
                  style={{ height: `${bar.height}%` }}
                  role="presentation"
                />
                <span className="text-[9px] text-zinc-600 sm:text-[10px]">
                  {bar.label}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="glass min-w-0 rounded-2xl p-4 sm:p-6">
          <h3 className="font-semibold text-white">Quick actions</h3>
          <p className="mt-1 text-sm text-zinc-500">Jump into your workflow</p>
          <ul className="mt-4 space-y-2">
            {[
              { label: "Generate new ad", href: "/dashboard/generate", primary: true },
              { label: "View history", href: "/dashboard/history", primary: false },
              { label: "Manage billing", href: "/dashboard/billing", primary: false },
              { label: "Brand settings", href: "/dashboard/settings", primary: false },
            ].map((action) => (
              <li key={action.label}>
                <Link
                  href={action.href}
                  className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition ${
                    action.primary
                      ? "bg-gradient-to-r from-cyan-500/20 via-violet-500/20 to-fuchsia-500/10 text-white hover:opacity-90"
                      : "border border-white/[0.06] bg-white/[0.02] text-zinc-300 hover:bg-white/[0.05]"
                  }`}
                >
                  {action.label}
                  <svg className="h-4 w-4 shrink-0 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <RecentAdsList ads={recentAds} />
    </DashboardShell>
  );
}