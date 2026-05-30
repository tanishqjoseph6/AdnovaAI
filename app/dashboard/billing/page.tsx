import DashboardShell from "@/components/dashboard/DashboardShell";

const invoices = [
  { date: "May 26, 2026", amount: "$99.00", status: "Paid" },
  { date: "Apr 26, 2026", amount: "$99.00", status: "Paid" },
  { date: "Mar 26, 2026", amount: "$99.00", status: "Paid" },
];

export default function BillingPage() {
  return (
    <DashboardShell
      title="Billing"
      subtitle="Manage your plan, payment method, and invoices"
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="gradient-border min-w-0 rounded-2xl bg-[#0a0618] p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm text-zinc-500">Current plan</p>
              <h2 className="mt-1 text-2xl font-bold text-white">Pro</h2>
              <p className="mt-2 text-sm text-zinc-400">
                $99/month · Renews Jun 26, 2026
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-gradient-to-r from-cyan-500/20 to-violet-500/20 px-3 py-1 text-xs font-medium text-cyan-300">
              Active
            </span>
          </div>
          <div className="mt-6 space-y-2 text-sm text-zinc-400">
            <p>500 ad generations / month</p>
            <p>Unlimited brand profiles</p>
            <p>All platform exports + AI studio</p>
          </div>
          <button
            type="button"
            className="mt-6 w-full rounded-xl border border-white/15 bg-white/5 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
          >
            Change plan
          </button>
        </section>

        <section className="glass min-w-0 rounded-2xl p-5 sm:p-6">
          <h3 className="font-semibold text-white">Payment method</h3>
          <div className="mt-4 flex flex-wrap items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="flex h-10 w-14 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 text-xs font-bold text-white">
              VISA
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white">•••• •••• •••• 4242</p>
              <p className="text-xs text-zinc-500">Expires 08/28</p>
            </div>
          </div>
          <button
            type="button"
            className="mt-4 text-sm font-medium text-cyan-400 hover:text-cyan-300"
          >
            Update payment method
          </button>
        </section>
      </div>

      <section className="glass mt-6 overflow-hidden rounded-2xl">
        <div className="border-b border-white/[0.06] px-4 py-4 sm:px-6">
          <h3 className="font-semibold text-white">Invoice history</h3>
        </div>
        <ul className="divide-y divide-white/[0.04]">
          {invoices.map((invoice) => (
            <li
              key={invoice.date}
              className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-white">{invoice.date}</p>
                <p className="text-xs text-zinc-500">Pro plan — monthly</p>
              </div>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                <span className="text-sm text-zinc-300">{invoice.amount}</span>
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs text-emerald-400">
                  {invoice.status}
                </span>
                <button
                  type="button"
                  className="text-sm font-medium text-cyan-400 hover:text-cyan-300"
                >
                  Download
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </DashboardShell>
  );
}
