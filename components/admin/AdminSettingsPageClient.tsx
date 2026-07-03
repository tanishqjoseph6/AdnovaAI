import { OWNER_EMAIL } from "@/lib/admin/auth";

export default function AdminSettingsPageClient() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
          Owner Settings
        </p>
        <h2 className="mt-3 text-xl font-semibold text-white">Access Control</h2>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">
          The owner account is locked to <span className="text-zinc-200">{OWNER_EMAIL}</span>.
          Team Members can operate support and notification workflows, but cannot
          change billing, roles, users, or owner settings.
        </p>
      </section>
      <section className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">
          System Settings
        </p>
        <h2 className="mt-3 text-xl font-semibold text-white">Protected Configuration</h2>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">
          Billing configuration, Razorpay credentials, API keys, environment
          variables, and pricing controls are intentionally not exposed in-app.
        </p>
      </section>
    </div>
  );
}
