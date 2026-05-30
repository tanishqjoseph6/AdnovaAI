import DashboardShell from "@/components/dashboard/DashboardShell";
import AdGeneratorSection from "@/components/dashboard/AdGeneratorSection";

export default function GenerateAdsPage() {
  return (
    <DashboardShell
      title="Generate Ads"
      subtitle="Create high-converting ads with AI in seconds"
    >
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <AdGeneratorSection />

        <section className="glass min-w-0 rounded-2xl p-5 sm:p-8">
          <div className="mb-6 flex flex-wrap items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30">
              <svg
                className="h-5 w-5 text-violet-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5"
                />
              </svg>
            </span>
            <div>
              <h2 className="text-lg font-semibold text-white">
                Campaign settings
              </h2>
              <p className="text-sm text-zinc-500">
                Optional — refine your ad brief after uploading
              </p>
            </div>
            <span className="w-full rounded-full border border-white/10 bg-white/5 px-3 py-1 text-center text-xs text-zinc-500 sm:ml-auto sm:w-auto">
              Step 2 of 2
            </span>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Target audience
              </label>
              <input
                type="text"
                placeholder="e.g. Gen Z fitness enthusiasts"
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/10"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Platform
              </label>
              <select className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-zinc-300 outline-none focus:border-cyan-400/40">
                <option>Meta (Facebook & Instagram)</option>
                <option>Google Ads</option>
                <option>TikTok</option>
                <option>LinkedIn</option>
                <option>All platforms</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Campaign goal
              </label>
              <select className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-zinc-300 outline-none focus:border-cyan-400/40">
                <option>Drive signups</option>
                <option>Increase sales</option>
                <option>Brand awareness</option>
                <option>App installs</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Additional context (optional)
              </label>
              <textarea
                rows={3}
                placeholder="Tone, offers, competitors to avoid..."
                className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/10"
              />
            </div>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
