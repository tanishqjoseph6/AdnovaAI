"use client";

import { useEffect, useState } from "react";

type Payment = {
  id: string | null;
  email: string | null;
  amount: number;
  plan: string;
  status: string;
  date: string | null;
  invoice: string | null;
  paymentId: string | null;
};

export default function AdminPaymentsPageClient() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      async function load() {
        setIsLoading(true);
        try {
          const params = new URLSearchParams();
          if (search) params.set("search", search);
          if (status) params.set("status", status);
          const response = await fetch(`/api/admin/payments?${params.toString()}`, { cache: "no-store" });
          const payload = (await response.json().catch(() => ({}))) as { payments?: Payment[]; error?: string };
          if (!response.ok) throw new Error(payload.error ?? "Unable to load payments.");
          setPayments(payload.payments ?? []);
          setError(null);
        } catch (loadError) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load payments.");
        } finally {
          setIsLoading(false);
        }
      }
      void load();
    }, 250);
    return () => window.clearTimeout(timer);
  }, [search, status]);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 rounded-3xl border border-white/[0.08] bg-white/[0.04] p-5 backdrop-blur-xl md:grid-cols-[1fr_12rem]">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search email, invoice, payment ID" className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-cyan-400/60" />
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/60">
          <option value="" className="bg-[#09031f]">All statuses</option>
          <option value="active" className="bg-[#09031f]">Active</option>
          <option value="inactive" className="bg-[#09031f]">Inactive</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-xl">
        {isLoading ? <div className="p-8 text-sm text-zinc-400">Loading payments...</div> : error ? <div className="p-8 text-sm text-red-200">{error}</div> : (
          <div className="divide-y divide-white/[0.06]">
            {payments.length === 0 ? <div className="p-8 text-sm text-zinc-400">No payments found.</div> : payments.map((payment) => (
              <div key={payment.paymentId ?? payment.id ?? payment.email ?? Math.random()} className="grid gap-3 p-4 text-sm md:grid-cols-[1fr_7rem_7rem_7rem_9rem_auto] md:items-center">
                <div><p className="font-medium text-white">{payment.email}</p><p className="text-xs text-zinc-500">{payment.paymentId}</p></div>
                <p className="text-zinc-300">₹{payment.amount.toLocaleString("en-IN")}</p>
                <p className="capitalize text-zinc-400">{payment.plan}</p>
                <p className="capitalize text-zinc-400">{payment.status}</p>
                <p className="text-xs text-zinc-500">{payment.date ?? "-"}</p>
                <button type="button" className="rounded-xl border border-red-400/25 bg-red-400/10 px-3 py-2 text-xs font-medium text-red-200">Refund</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
