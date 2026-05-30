export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
      <div className="pointer-events-none absolute inset-0 grid-bg" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-cyan-500/20 blur-[120px] animate-pulse-glow" />
      <div className="pointer-events-none absolute top-20 right-0 h-[400px] w-[400px] rounded-full bg-violet-600/20 blur-[100px]" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-[300px] w-[300px] rounded-full bg-fuchsia-600/15 blur-[80px]" />

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-zinc-300 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
            </span>
            Now generating 10M+ ad variants monthly
          </div>

          <h1 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl md:leading-[1.1]">
            Create high-converting ads{" "}
            <span className="gradient-text">in seconds</span>, not weeks
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-400 md:text-xl">
            AdNova AI turns your product URL into scroll-stopping copy, visuals,
            and multi-channel campaigns—optimized by machine learning for every
            platform.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="#cta"
              className="group flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 px-8 py-4 text-base font-semibold text-white shadow-xl shadow-violet-500/25 transition hover:scale-[1.02] hover:opacity-95 sm:w-auto"
            >
              Generate your first ad
              <svg
                className="h-4 w-4 transition group-hover:translate-x-0.5"
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
            </a>
            <a
              href="#features"
              className="flex w-full items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-8 py-4 text-base font-medium text-zinc-200 backdrop-blur-sm transition hover:bg-white/10 sm:w-auto"
            >
              <svg
                className="h-5 w-5 text-cyan-400"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
              Watch demo
            </a>
          </div>

          <p className="mt-4 text-sm text-zinc-500">
            No credit card required · 14-day free trial
          </p>
        </div>

        <div className="relative mx-auto mt-16 max-w-4xl animate-float">
          <div className="gradient-border overflow-hidden rounded-2xl shadow-2xl shadow-violet-500/10">
            <div className="glass p-1">
              <div className="overflow-hidden rounded-xl bg-[#0a0618]">
                <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
                  <span className="h-3 w-3 rounded-full bg-red-500/80" />
                  <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
                  <span className="h-3 w-3 rounded-full bg-green-500/80" />
                  <span className="ml-4 text-xs text-zinc-500">
                    adnova.ai/studio
                  </span>
                </div>
                <div className="grid gap-4 p-6 md:grid-cols-2">
                  <div className="space-y-3">
                    <p className="text-xs font-medium uppercase tracking-wider text-cyan-400">
                      Input
                    </p>
                    <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-zinc-400">
                      Product: Premium wireless earbuds
                      <br />
                      Audience: Gen Z fitness enthusiasts
                      <br />
                      Goal: Drive trial signups
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-xs font-medium uppercase tracking-wider text-fuchsia-400">
                      AI Output
                    </p>
                    <div className="rounded-lg border border-violet-500/30 bg-gradient-to-br from-violet-500/10 to-cyan-500/10 p-4">
                      <p className="text-sm font-medium text-white">
                        Hear every beat. Miss nothing.
                      </p>
                      <p className="mt-2 text-xs text-zinc-400">
                        12 variants · Meta + TikTok + Google · A/B ready
                      </p>
                      <div className="mt-3 flex gap-2">
                        <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-xs text-cyan-300">
                          +34% CTR
                        </span>
                        <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-xs text-violet-300">
                          Brand-safe
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-center gap-x-12 gap-y-6 opacity-60">
          {["Shopify", "Stripe", "Notion", "Linear", "Vercel"].map((brand) => (
            <span
              key={brand}
              className="text-sm font-medium tracking-widest text-zinc-500 uppercase"
            >
              {brand}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
