"use client";

import { useEffect, useState } from "react";

type Announcement = {
  id: string;
  title: string;
  message: string;
  category: "new_feature" | "maintenance" | "beta_update";
  is_active: boolean;
  created_at: string;
};

export default function AdminAnnouncementsPageClient() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState<Announcement["category"]>("beta_update");
  const [toast, setToast] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  async function load() {
    setIsLoading(true);
    const response = await fetch("/api/admin/announcements", { cache: "no-store" });
    const payload = (await response.json().catch(() => ({}))) as { announcements?: Announcement[]; error?: string };
    if (response.ok) setAnnouncements(payload.announcements ?? []);
    else setToast(payload.error ?? "Unable to load announcements.");
    setIsLoading(false);
  }

  useEffect(() => { void load(); }, []);

  async function send() {
    setIsSending(true);
    const response = await fetch("/api/admin/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, message, category }),
    });
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    if (response.ok) {
      setTitle("");
      setMessage("");
      setToast("Announcement sent.");
      await load();
    } else {
      setToast(payload.error ?? "Unable to send announcement.");
    }
    setIsSending(false);
  }

  return (
    <div className="space-y-6">
      {toast && <div className="rounded-2xl border border-cyan-400/25 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-200">{toast}</div>}
      <section className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-5 backdrop-blur-xl">
        <h2 className="text-lg font-semibold text-white">Send announcement</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-[1fr_14rem]">
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Title" className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600" />
          <select value={category} onChange={(event) => setCategory(event.target.value as Announcement["category"])} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none">
            <option value="new_feature" className="bg-[#09031f]">🚀 New Feature</option>
            <option value="maintenance" className="bg-[#09031f]">⚠ Maintenance</option>
            <option value="beta_update" className="bg-[#09031f]">🎉 Beta Update</option>
          </select>
        </div>
        <textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={4} placeholder="Message visible to all users" className="mt-4 w-full resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600" />
        <button type="button" onClick={() => void send()} disabled={isSending} className="mt-4 rounded-2xl bg-gradient-to-r from-cyan-400 to-violet-500 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">{isSending ? "Sending..." : "Send Announcement"}</button>
      </section>

      <section className="overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-xl">
        {isLoading ? <div className="p-8 text-sm text-zinc-400">Loading announcements...</div> : announcements.length === 0 ? <div className="p-8 text-sm text-zinc-400">No announcements yet.</div> : announcements.map((item) => (
          <article key={item.id} className="border-b border-white/[0.06] p-4 last:border-b-0">
            <p className="font-medium text-white">{item.title}</p>
            <p className="mt-1 text-sm text-zinc-400">{item.message}</p>
            <p className="mt-2 text-xs text-zinc-600">{item.category} · {item.created_at}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
