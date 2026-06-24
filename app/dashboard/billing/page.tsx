import DashboardShell from "@/components/dashboard/DashboardShell";

export default function BillingPage() {
  return (
    <DashboardShell
      title="Billing"
      subtitle="Manage your AdvoraAI subscription"
    >
      <div className="space-y-6">
        {/* Current Plan */}
        <section className="gradient-border rounded-2xl bg-[#0a0618] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-500">Current Plan</p>
              <h2 className="mt-1 text-2xl font-bold text-white">
                Starter ⭐
              </h2>
              <p className="mt-2 text-sm text-zinc-400">
                ₹999/month
              </p>
            </div>

            <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs font-medium text-green-300">
              Active
            </span>
          </div>

          <div className="mt-6 space-y-2 text-sm text-zinc-400">
            <p>✅ 100 Ad Hooks / month</p>
            <p>✅ 100 Captions / month</p>
            <p>✅ 50 UGC Scripts / month</p>
          </div>

          <div className="mt-6 space-y-3">
            <a
              href="https://rzp.io/rzp/J1D9Wo2"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full rounded-xl bg-blue-600 py-3 text-center font-medium text-white hover:bg-blue-700"
            >
              Upgrade to Starter 🚀 ₹999
            </a>

            <a
              href="https://rzp.io/rzp/b3jiN5f"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full rounded-xl bg-purple-600 py-3 text-center font-medium text-white hover:bg-purple-700"
            >
              Upgrade to Pro 👑 ₹2999
            </a>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="glass rounded-2xl p-6">
          <h3 className="text-2xl font-bold text-white">
            Available Plans
          </h3>

          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {/* Starter */}
            <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-6 transition-all duration-300 hover:border-cyan-400 hover:shadow-lg hover:shadow-cyan-500/20">
            🚀 Starter
            <span className="inline-block rounded-full bg-cyan-500/20 px-3 py-1 text-xs font-bold text-cyan-300">
                 BEST FOR BEGINNERS
               </span>

              <p className="mt-3 text-5xl font-bold text-cyan-300">
                ₹999
              </p>

              <p className="text-zinc-400">per month</p>

              <ul className="mt-6 space-y-2 text-zinc-300">
                <li>✅ 100 Ad Hooks</li>
                <li>✅ 100 Captions</li>
                <li>✅ 50 UGC Scripts</li>
              </ul>

              <a
                href="https://rzp.io/rzp/J1D9Wo2"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 block rounded-xl bg-cyan-500 py-3 text-center font-semibold text-white hover:bg-cyan-600"
              >
                Get Starter
              </a>
            </div>

            {/* Pro */}
            <div className="relative scale-105 rounded-3xl border-2 border-violet-400 bg-gradient-to-b from-violet-500/20 to-pink-500/10 p-6 shadow-2xl shadow-violet-500/40">
            <span className="inline-block rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 px-4 py-1 text-xs font-bold text-black shadow-lg">
              🔥 MOST POPULAR
                </span>

              <h3 className="mt-4 text-xl font-bold text-white">
                👑 Pro
              </h3>

              <p className="mt-3 text-4xl font-bold text-white">
                ₹2999
              </p>

              <p className="text-zinc-400">per month</p>

              <ul className="mt-6 space-y-2 text-zinc-300">
                <li>✅ Unlimited Ad Hooks</li>
                <li>✅ Unlimited Captions</li>
                <li>✅ Unlimited UGC Scripts</li>
                <li>✅ Priority Support</li>
              </ul>

              <a
                href="https://rzp.io/rzp/b3jiN5f"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 block rounded-xl bg-gradient-to-r from-violet-500 to-pink-500 py-3 text-center font-semibold text-white"
              >
                Upgrade to Pro
              </a>
            </div>

            {/* Pro Plus */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h3 className="text-xl font-bold text-white">
                💎 Pro Plus
              </h3>

              <p className="mt-3 text-4xl font-bold text-white">
                Custom
              </p>

              <p className="text-zinc-400">Contact Sales</p>

              <p className="text-xs text-cyan-400 mt-2">
               Best for agencies and growing brands
               </p>
               
              <ul className="mt-6 space-y-2 text-zinc-300">
                <li>✅ Everything in Pro</li>
                <li>✅ Dedicated Support</li>
                <li>✅ Team Access</li>
                <li>✅ Custom Features</li>
              </ul>

              <a
                href="mailto:hello@advoraai.com"
                className="mt-6 block w-full rounded-xl border border-cyan-500/30 py-3 text-center font-semibold text-white hover:bg-cyan-500/10"
>
            💎 Contact Sales (Coming Soon)
              </a>
            </div>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}