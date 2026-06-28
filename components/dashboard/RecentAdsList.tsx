import Link from "next/link";

type Ad = {
  name: string;
  platform: string;
  status: string;
  ctr: string;
  date: string;
};

const statusStyles: Record<string, string> = {
  Live: "bg-emerald-500/10 text-emerald-400",
  Draft: "bg-zinc-500/10 text-zinc-400",
  Paused: "bg-amber-500/10 text-amber-400",
};

type RecentAdsListProps = {
  ads: Ad[];
};

export default function RecentAdsList({ ads }: RecentAdsListProps) {
  return (
    <section className="glass mt-6 overflow-hidden rounded-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-4 sm:px-6">
        <div>
          <h3 className="font-semibold text-white">Recent ads</h3>
          <p className="text-sm text-zinc-500">
            Your latest AI-generated creatives
          </p>
        </div>
        <Link
          href="/dashboard/history"
          className="text-sm font-medium text-cyan-400 hover:text-cyan-300"
        >
          View all →
        </Link>
      </div>

      <ul className="divide-y divide-white/[0.04] md:hidden">
        {ads.map((ad) => (
          <li key={ad.name} className="p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="min-w-0 break-words font-medium text-white">{ad.name}</p>
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[ad.status] ?? statusStyles.Draft}`}
              >
                {ad.status}
              </span>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
              <div>
                <dt className="text-zinc-600">Platform</dt>
                <dd className="mt-0.5 text-zinc-300">{ad.platform}</dd>
              </div>
              <div>
                <dt className="text-zinc-600">CTR</dt>
                <dd className="mt-0.5 text-zinc-300">{ad.ctr}</dd>
              </div>
              <div>
                <dt className="text-zinc-600">Created</dt>
                <dd className="mt-0.5 text-zinc-500">{ad.date}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/[0.06] text-xs uppercase tracking-wider text-zinc-500">
              <th className="px-6 py-3 font-medium">Campaign</th>
              <th className="px-6 py-3 font-medium">Platform</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium">CTR</th>
              <th className="px-6 py-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {ads.map((ad) => (
              <tr
                key={ad.name}
                className="border-b border-white/[0.04] transition hover:bg-white/[0.02]"
              >
                <td className="px-6 py-4 font-medium text-white">{ad.name}</td>
                <td className="px-6 py-4 text-zinc-400">{ad.platform}</td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[ad.status] ?? statusStyles.Draft}`}
                  >
                    {ad.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-zinc-300">{ad.ctr}</td>
                <td className="px-6 py-4 text-zinc-500">{ad.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
