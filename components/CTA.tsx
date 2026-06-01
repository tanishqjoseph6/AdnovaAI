export default function CTA() {
  return (
    <section id="cta" className="relative py-24 md:py-32">
      <div className="relative mx-auto max-w-6xl px-6">
        <div className="relative overflow-hidden rounded-3xl">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/30 via-violet-600/40 to-fuchsia-600/30" />
          <div className="absolute inset-0 grid-bg opacity-50" />
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-400/30 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-fuchsia-500/30 blur-3xl" />

          <div className="relative border border-white/10 px-8 py-16 text-center md:px-16 md:py-20">
            <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
              Ready to launch ads that{" "}
              <span className="gradient-text">actually convert</span>?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-zinc-300">
              Join 12,000+ marketers using Advora AI to ship creative faster
              and spend smarter.
            </p>

            <div className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row">
              <input
                type="email"
                placeholder="you@company.com"
                className="flex-1 rounded-full border border-white/20 bg-black/30 px-5 py-3.5 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
              />
              <button
                type="button"
                className="rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-[#030014] shadow-lg transition hover:bg-zinc-100"
              >
                Get started free
              </button>
            </div>

            <p className="mt-4 text-sm text-zinc-400">
              14-day trial · Setup in under 2 minutes · Cancel anytime
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
