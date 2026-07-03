import Link from "next/link";
import type { BillingInvoice } from "@/lib/billing/invoices";
import BillingInvoiceDate from "@/components/billing/BillingInvoiceDate";

type BillingHistoryTableProps = {
  invoices: BillingInvoice[];
};

function PaymentStatusBadge({
  status,
}: {
  status: BillingInvoice["paymentStatus"];
}) {
  const styles: Record<BillingInvoice["paymentStatus"], string> = {
    Paid: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    Pending: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    Failed: "border-red-500/30 bg-red-500/10 text-red-300",
    Cancelled: "border-zinc-500/30 bg-zinc-500/10 text-zinc-400",
    Refunded: "border-zinc-500/30 bg-zinc-500/10 text-zinc-400",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {status}
    </span>
  );
}

export default function BillingHistoryTable({
  invoices,
}: BillingHistoryTableProps) {
  return (
    <section className="glass overflow-hidden rounded-2xl border border-white/[0.08]">
      <div className="flex flex-col gap-3 border-b border-white/[0.06] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5 lg:px-8">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-cyan-400">
            Billing
          </p>
          <h3 className="mt-1 text-xl font-bold tracking-tight text-white sm:text-2xl">
            Billing history
          </h3>
        </div>
        <Link
          href="/dashboard/billing/history"
          className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-zinc-200 transition hover:bg-white/[0.08]"
        >
          View all payments
        </Link>
      </div>

      {invoices.length === 0 ? (
        <div className="px-6 py-12 text-center sm:px-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
            <svg
              className="h-7 w-7 text-zinc-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <p className="mt-4 text-sm font-medium text-white">No invoices yet</p>
          <p className="mt-1 text-sm text-zinc-500">
            Your payment receipts will appear here after you upgrade.
          </p>
        </div>
      ) : (
        <>
          <p className="table-scroll-hint px-4 pt-3 sm:px-6 lg:px-8">
            Swipe horizontally to view invoices →
          </p>
          <div className="table-scroll-container pb-2 sm:pb-0">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.02] text-xs font-medium uppercase tracking-wider text-zinc-500">
                  <th className="px-6 py-3.5 sm:px-8">Invoice</th>
                  <th className="px-4 py-3.5">Date</th>
                  <th className="px-4 py-3.5">Plan</th>
                  <th className="px-4 py-3.5">Amount</th>
                  <th className="px-4 py-3.5 sm:pr-8">Payment status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.slice(0, 5).map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="border-b border-white/[0.04] transition hover:bg-white/[0.02]"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-white sm:px-8">
                      {invoice.invoiceLabel}
                    </td>
                    <td className="px-4 py-4 text-sm text-zinc-400">
                      <BillingInvoiceDate iso={invoice.dateIso} />
                    </td>
                    <td className="px-4 py-4 text-sm text-zinc-300">
                      {invoice.planName}
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-zinc-200">
                      {invoice.amountLabel}
                    </td>
                    <td className="px-4 py-4 sm:pr-8">
                      <PaymentStatusBadge status={invoice.paymentStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
