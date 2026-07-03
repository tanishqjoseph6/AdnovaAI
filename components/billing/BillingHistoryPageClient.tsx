"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import BillingInvoiceDate from "@/components/billing/BillingInvoiceDate";

type BillingHistoryItem = {
  id: string;
  invoiceLabel: string;
  date: string;
  planName: string;
  amountLabel: string;
  status: string;
  paymentId: string;
  orderId: string;
  billingInterval: string | null;
};

function PaymentStatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const styles =
    normalized === "success"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
      : normalized === "failed"
        ? "border-red-500/30 bg-red-500/10 text-red-300"
        : normalized === "refunded"
          ? "border-zinc-500/30 bg-zinc-500/10 text-zinc-400"
          : "border-amber-500/30 bg-amber-500/10 text-amber-300";

  const label =
    normalized === "success"
      ? "Paid"
      : normalized.charAt(0).toUpperCase() + normalized.slice(1);

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles}`}
    >
      {label}
    </span>
  );
}

export default function BillingHistoryPageClient() {
  const [payments, setPayments] = useState<BillingHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const response = await fetch("/api/payments", { cache: "no-store" });
        const payload = (await response.json()) as {
          payments?: BillingHistoryItem[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error ?? "Unable to load billing history.");
        }

        setPayments(payload.payments ?? []);
        setError(null);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load billing history."
        );
      } finally {
        setIsLoading(false);
      }
    }

    void load();
  }, []);

  const successfulPayments = useMemo(
    () => payments.filter((payment) => payment.status === "success"),
    [payments]
  );

  async function handleDownload(paymentId: string) {
    setDownloadingId(paymentId);
    try {
      const response = await fetch(`/api/payments/${paymentId}/invoice`);
      if (!response.ok) {
        throw new Error("Unable to download invoice.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `invoice-${paymentId.slice(0, 8)}.pdf`;
      anchor.click();
      window.URL.revokeObjectURL(url);
    } catch {
      setError("Unable to download invoice. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-5 backdrop-blur-xl">
        <p className="text-sm text-zinc-400">
          View all successful payments and download PDF invoices for your records.
        </p>
        <Link
          href="/dashboard/billing"
          className="mt-3 inline-flex text-sm text-cyan-300 hover:text-cyan-200"
        >
          ← Back to billing
        </Link>
      </div>

      <section className="glass overflow-hidden rounded-2xl border border-white/[0.08]">
        <div className="border-b border-white/[0.06] px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
          <p className="text-xs font-medium uppercase tracking-widest text-cyan-400">
            Billing
          </p>
          <h3 className="mt-1 text-xl font-bold tracking-tight text-white sm:text-2xl">
            Payment history
          </h3>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 px-6 py-12 text-sm text-zinc-400">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Loading payment history…
          </div>
        ) : error ? (
          <div className="px-6 py-12 text-sm text-red-200">{error}</div>
        ) : successfulPayments.length === 0 ? (
          <div className="px-6 py-12 text-center sm:px-8">
            <p className="text-sm font-medium text-white">No payments yet</p>
            <p className="mt-1 text-sm text-zinc-500">
              Your successful payments and invoices will appear here after you upgrade.
            </p>
            <Link
              href="/dashboard/billing"
              className="mt-4 inline-flex rounded-xl bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 px-4 py-2.5 text-sm font-semibold text-white"
            >
              View plans
            </Link>
          </div>
        ) : (
          <>
            <p className="table-scroll-hint px-4 pt-3 sm:px-6 lg:px-8">
              Swipe horizontally to view all columns →
            </p>
            <div className="table-scroll-container pb-2 sm:pb-0">
              <table className="w-full min-w-[760px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02] text-xs font-medium uppercase tracking-wider text-zinc-500">
                    <th className="px-6 py-3.5 sm:px-8">Invoice</th>
                    <th className="px-4 py-3.5">Date</th>
                    <th className="px-4 py-3.5">Plan</th>
                    <th className="px-4 py-3.5">Amount</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5 sm:pr-8">Invoice</th>
                  </tr>
                </thead>
                <tbody>
                  {successfulPayments.map((payment) => (
                    <tr
                      key={payment.id}
                      className="border-b border-white/[0.04] transition hover:bg-white/[0.02]"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-white sm:px-8">
                        {payment.invoiceLabel}
                      </td>
                      <td className="px-4 py-4 text-sm text-zinc-400">
                        <BillingInvoiceDate iso={payment.date} />
                      </td>
                      <td className="px-4 py-4 text-sm capitalize text-zinc-300">
                        {payment.planName}
                        {payment.billingInterval
                          ? ` · ${payment.billingInterval}`
                          : ""}
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-zinc-200">
                        {payment.amountLabel}
                      </td>
                      <td className="px-4 py-4">
                        <PaymentStatusBadge status={payment.status} />
                      </td>
                      <td className="px-4 py-4 sm:pr-8">
                        <button
                          type="button"
                          onClick={() => void handleDownload(payment.id)}
                          disabled={downloadingId === payment.id}
                          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-zinc-200 transition hover:bg-white/[0.08] disabled:opacity-60"
                        >
                          {downloadingId === payment.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                          ) : (
                            <Download className="h-3.5 w-3.5" aria-hidden />
                          )}
                          Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
