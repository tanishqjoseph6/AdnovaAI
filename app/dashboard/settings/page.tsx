import DashboardShell from "@/components/dashboard/DashboardShell";

export default function SettingsPage() {
  return (
    <DashboardShell
      title="Settings"
      subtitle="Configure your workspace, brand, and preferences"
    >
      <div className="mx-auto max-w-2xl space-y-6">
        <section className="glass rounded-2xl p-6">
          <h3 className="font-semibold text-white">Profile</h3>
          <p className="mt-1 text-sm text-zinc-500">Your account information</p>
          <div className="mt-5 space-y-4">
            <div>
              <label className="mb-2 block text-sm text-zinc-400">Full name</label>
              <input
                type="text"
                defaultValue="Tanishq Joseph"
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-400/40"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-zinc-400">Email</label>
              <input
                type="email"
                defaultValue="you@company.com"
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-400/40"
              />
            </div>
          </div>
        </section>

        <section className="glass rounded-2xl p-6">
          <h3 className="font-semibold text-white">Brand voice</h3>
          <p className="mt-1 text-sm text-zinc-500">Default tone for AI-generated copy</p>
          <div className="mt-5">
            <select className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-zinc-300 outline-none">
              <option>Professional & confident</option>
              <option>Friendly & casual</option>
              <option>Bold & disruptive</option>
              <option>Luxury & refined</option>
            </select>
          </div>
        </section>

        <section className="glass rounded-2xl p-6">
          <h3 className="font-semibold text-white">Notifications</h3>
          <ul className="mt-4 space-y-3">
            {[
              "Email when generation completes",
              "Weekly performance digest",
              "Credit usage alerts",
            ].map((label) => (
              <li key={label} className="flex items-center justify-between">
                <span className="text-sm text-zinc-300">{label}</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked="true"
                  className="relative h-6 w-11 rounded-full bg-gradient-to-r from-cyan-500 to-violet-500"
                >
                  <span className="absolute right-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition" />
                </button>
              </li>
            ))}
          </ul>
        </section>

        <button
          type="button"
          className="w-full rounded-xl bg-white/5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
        >
          Save changes
        </button>
      </div>
    </DashboardShell>
  );
}
