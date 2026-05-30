import DashboardShell from "@/components/dashboard/DashboardShell";

const historyItems = [
  { id: "AD-2841", name: "Wireless Earbuds — Meta", variants: 12, platform: "Meta", date: "May 26, 2026", credits: 5 },
  { id: "AD-2839", name: "SaaS Trial — Google", variants: 8, platform: "Google", date: "May 25, 2026", credits: 5 },
  { id: "AD-2835", name: "Fitness App — TikTok", variants: 15, platform: "TikTok", date: "May 24, 2026", credits: 5 },
  { id: "AD-2828", name: "Skincare Bundle — Meta", variants: 10, platform: "Meta", date: "May 22, 2026", credits: 5 },
  { id: "AD-2820", name: "Coffee Subscription — Meta", variants: 12, platform: "Meta", date: "May 20, 2026", credits: 5 },
];

export default function HistoryPage() {
  return (
    <DashboardShell
      title="History"
      subtitle="Browse and re-export your past ad generations"
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          aria-label="Search ad history"
          placeholder="Search by name or ID..."
          className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-base text-white placeholder:text-zinc-600 outline-none focus:border-cyan-400/40 sm:max-w-sm sm:text-sm"
        />
        <select
          aria-label="Filter by platform"
          className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-base text-zinc-300 outline-none sm:w-auto sm:text-sm"
        >
          <option>All platforms</option>
          <option>Meta</option>
          <option>Google</option>
          <option>TikTok</option>
        </select>
      </div>

      <div className="space-y-3">
        {historyItems.map((item) => (
          <article
            key={item.id}
            className="glass flex flex-col gap-4 rounded-2xl p-5 transition hover:border-white/12 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-cyan-400">{item.id}</span>
                <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-zinc-400">
                  {item.platform}
                </span>
              </div>
              <h3 className="mt-1 truncate font-medium text-white">{item.name}</h3>
              <p className="mt-1 text-sm text-zinc-500">
                {item.variants} variants · {item.date} · {item.credits} credits
              </p>
            </div>
            <div className="flex w-full shrink-0 gap-2 sm:w-auto">
              <button
                type="button"
                className="flex-1 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-zinc-300 transition hover:bg-white/5 sm:flex-none sm:py-2"
              >
                View
              </button>
              <button
                type="button"
                className="flex-1 rounded-xl bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10 sm:flex-none sm:py-2"
              >
                Export
              </button>
            </div>
          </article>
        ))}
      </div>
    </DashboardShell>
  );
}
