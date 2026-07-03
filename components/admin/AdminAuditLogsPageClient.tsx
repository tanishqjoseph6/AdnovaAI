"use client";

import { useEffect, useState } from "react";

type AuditLog = {
  id: string;
  admin_email: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  created_at: string;
};

export default function AdminAuditLogsPageClient() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const response = await fetch("/api/admin/audit-logs", { cache: "no-store" });
      const payload = (await response.json().catch(() => ({}))) as { logs?: AuditLog[]; error?: string };
      if (response.ok) setLogs(payload.logs ?? []);
      else setError(payload.error ?? "Unable to load audit logs.");
      setIsLoading(false);
    }
    void load();
  }, []);

  return (
    <div className="overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-xl">
      {isLoading ? <div className="p-8 text-sm text-zinc-400">Loading audit logs...</div> : error ? <div className="p-8 text-sm text-red-200">{error}</div> : logs.length === 0 ? <div className="p-8 text-sm text-zinc-400">No audit logs yet.</div> : (
        <div className="divide-y divide-white/[0.06]">
          {logs.map((log) => (
            <article key={log.id} className="grid gap-2 p-4 text-sm md:grid-cols-[1fr_14rem_10rem] md:items-center">
              <div>
                <p className="font-medium text-white">{log.action.replaceAll("_", " ")}</p>
                <p className="text-xs text-zinc-500">{log.target_type ?? "system"} · {log.target_id ?? "-"}</p>
              </div>
              <p className="text-zinc-400">{log.admin_email ?? "Unknown admin"}</p>
              <p className="text-xs text-zinc-600">{log.created_at}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
