"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Loader2 } from "lucide-react";

type Payment = {
  id: string;
  userId: string;
  email: string | null;
  amount: number;
  amountLabel: string;
  currency: string;
  plan: string;
  status: string;
  billingInterval: string | null;
  date: string;
  paymentId: string;
  orderId: string;
};

function statusBadgeClass(status: string): string {
  if (status === "success") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  }
  if (status === "failed") {
    return "border-red-500/30 bg-red-500/10 text-red-300";
  }
  return "border-zinc-500/30 bg-zinc-500/10 text-zinc-300";
}

export default function AdminPaymentsPageClient() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [plan, setPlan] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    if (plan) params.set("plan", plan);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    return params.toString();
  }, [search, status, plan, from, to]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      async function load() {
        setIsLoading(true);
        try {
          const response = await fetch(
            `/api/admin/payments${queryString ? `?${queryString}` : ""}`,
            { cache: "no-store" }
          );
          const payload = (await response.json().catch(() => ({}))) as {
            payments?: Payment[];
            error?: string;
            schemaReady?: boolean;
          };

          if (!response.ok) {
            throw new Error(payload.error ?? "Unable to load payments.");
          }

          setPayments(payload.payments ?? []);
          setError(
            payload.schemaReady === false
              ? "Payments table is not ready yet. Run the latest Supabase migration."
              : null
          );
        } catch (loadError) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load payments."
          );
        } finally {
          setIsLoading(false);
        }
      }

      void load();
    }, 250);

    return () => window.clearTimeout(timer);
  }, [queryString]);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams(queryString);
      params.set("export", "csv");
      const response = await fetch(`/api/admin/payments?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Unable to export payments.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `advora-payments-${new Date().toISOString().slice(0, 10)}.csv`;
      anchor.click();
      window.URL.revokeObjectURL(url);
    } catch (exportError) {
      setError(
        exportError instanceof Error
          ? exportError.message
          : "Unable to export payments."
      );
    } finally {
      setIsExporting(false);
    }
  }, [queryString]);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 rounded-3xl border border-white/[0.08] bg-white/[0.04] p-5 backdrop-blur-xl md:grid-cols-2 xl:grid-cols-[1fr_10rem_10rem_10rem_10rem_auto]">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search email, payment ID, order ID"
          className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-cyan-400/60 md:col-span-2 xl:col-span-1"
        />
        <select
          value={plan}
          onChange={(event) => setPlan(event.target.value)}
          className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/60"
        >
          <option value="" className="bg-[#09031f]">
            All plans
          </option>
          <option value="starter" className="bg-[#09031f]">
            Starter
          </option>
          <option value="pro" className="bg-[#09031f]">
            Pro
          </option>
        </select>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/60"
        >
          <option value="" className="bg-[#09031f]">
            All statuses
          </option>
          <option value="success" className="bg-[#09031f]">
            Success
          </option>
          <option value="failed" className="bg-[#09031f]">
            Failed
          </option>
          <option value="refunded" className="bg-[#09031f]">
            Refunded
          </option>
        </select>
        <input
          type="date"
          value={from}
          onChange={(event) => setFrom(event.target.value)}
          className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/60"
        />
        <input
          type="date"
          value={to}
          onChange={(event) => setTo(event.target.value)}
          className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/60"
        />
        <button
          type="button"
          onClick={() => void handleExport()}
          disabled={isExporting || payments.length === 0}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-3 text-sm font-medium text-cyan-200 transition hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-50 md:col-span-2 xl:col-span-1"
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Download className="h-4 w-4" aria-hidden />
          )}
          Export CSV
        </button>
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-xl">
        {isLoading ? (
          <div className="flex items-center gap-2 p-8 text-sm text-zinc-400">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Loading payments…
          </div>
        ) : error && payments.length === 0 ? (
          <div className="p-8 text-sm text-red-200">{error}</div>
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {payments.length === 0 ? (
              <div className="p-8 text-sm text-zinc-400">No payments found.</div>
            ) : (
              payments.map((payment) => (
                <div
                  key={payment.id}
                  className="grid gap-3 p-4 text-sm md:grid-cols-[minmax(0,1.4fr)_7rem_6rem_7rem_8rem_auto] md:items-center"
                >
                  <div>
                    <p className="font-medium text-white">{payment.email ?? "—"}</p>
                    <p className="text-xs text-zinc-500">{payment.paymentId}</p>
                    <p className="text-xs text-zinc-600">{payment.orderId}</p>
                  </div>
                  <p className="font-medium text-zinc-200">{payment.amountLabel}</p>
                  <p className="capitalize text-zinc-400">{payment.plan}</p>
                  <span
                    className={`inline-flex w-fit rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${statusBadgeClass(payment.status)}`}
                  >
                    {payment.status}
                  </span>
                  <p className="text-xs text-zinc-500">
                    {new Date(payment.date).toLocaleString("en-IN")}
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
