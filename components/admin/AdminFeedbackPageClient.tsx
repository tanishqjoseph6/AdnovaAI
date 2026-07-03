"use client";

import { useEffect, useMemo, useState } from "react";
import {
  feedbackCategoryClasses,
  feedbackStatusClasses,
  formatFeedbackStatus,
  formatFeedbackTime,
  type AdminFeedbackTicketView,
} from "@/lib/feedback/client";
import type { FeedbackStatus } from "@/lib/feedback/server";

type AdminFeedbackResponse = {
  tickets?: AdminFeedbackTicketView[];
  error?: string;
};

type Draft = {
  status: FeedbackStatus;
  adminReply: string;
};

const STATUSES: FeedbackStatus[] = ["open", "reviewed", "closed"];

export default function AdminFeedbackPageClient() {
  const [tickets, setTickets] = useState<AdminFeedbackTicketView[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [tab, setTab] = useState<"open" | "reviewed" | "closed">("open");
  const [category, setCategory] = useState<"all" | "bug_report" | "feature_request" | "general_feedback">("all");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    async function loadTickets() {
      setIsLoading(true);
      try {
        const response = await fetch("/api/admin/feedback", {
          cache: "no-store",
        });
        const payload = (await response.json().catch(() => ({}))) as
          AdminFeedbackResponse;
        if (!response.ok) {
          throw new Error(payload.error ?? "Unable to load feedback.");
        }

        const loadedTickets = payload.tickets ?? [];
        setTickets(loadedTickets);
        setDrafts(
          Object.fromEntries(
            loadedTickets.map((ticket) => [
              ticket.id,
              {
                status: ticket.status,
                adminReply: ticket.adminReply ?? "",
              },
            ])
          )
        );
      } catch (error) {
        setToast({
          type: "error",
          message:
            error instanceof Error
              ? error.message
              : "Unable to load feedback.",
        });
      } finally {
        setIsLoading(false);
      }
    }

    void loadTickets();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const summary = useMemo(
    () => ({
      open: tickets.filter((ticket) => ticket.status === "open").length,
      reviewed: tickets.filter((ticket) => ticket.status === "reviewed").length,
      closed: tickets.filter((ticket) => ticket.status === "closed").length,
    }),
    [tickets]
  );

  const filteredTickets = useMemo(
    () =>
      tickets.filter((ticket) => {
        const matchesTab = ticket.status === tab;
        const matchesCategory = category === "all" || ticket.category === category;
        const query = search.trim().toLowerCase();
        const matchesSearch =
          !query ||
          ticket.subject.toLowerCase().includes(query) ||
          ticket.message.toLowerCase().includes(query) ||
          ticket.email.toLowerCase().includes(query);
        return matchesTab && matchesCategory && matchesSearch;
      }),
    [category, search, tab, tickets]
  );

  function updateDraft(ticketId: string, patch: Partial<Draft>) {
    setDrafts((current) => ({
      ...current,
      [ticketId]: {
        status: current[ticketId]?.status ?? "open",
        adminReply: current[ticketId]?.adminReply ?? "",
        ...patch,
      },
    }));
  }

  async function saveTicket(ticketId: string) {
    const draft = drafts[ticketId];
    if (!draft || savingId) return;

    setSavingId(ticketId);
    try {
      const response = await fetch(
        `/api/admin/feedback/${encodeURIComponent(ticketId)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(draft),
        }
      );
      const payload = (await response.json().catch(() => ({}))) as
        | { ticket?: AdminFeedbackTicketView; error?: string }
        | undefined;

      if (!response.ok || !payload?.ticket) {
        throw new Error(payload?.error ?? "Unable to save feedback.");
      }

      const updatedTicket = payload.ticket;
      setTickets((current) =>
        current.map((ticket) =>
          ticket.id === ticketId
            ? { ...ticket, ...updatedTicket, profile: ticket.profile }
            : ticket
        )
      );
      setDrafts((current) => ({
        ...current,
        [ticketId]: {
          status: updatedTicket.status,
          adminReply: updatedTicket.adminReply ?? "",
        },
      }));
      setToast({
        type: "success",
        message: "Feedback updated and user notification queued.",
      });
    } catch (error) {
      setToast({
        type: "error",
        message:
          error instanceof Error ? error.message : "Unable to save feedback.",
      });
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div
          role={toast.type === "error" ? "alert" : "status"}
          className={`rounded-2xl border px-4 py-3 text-sm ${
            toast.type === "success"
              ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200"
              : "border-red-400/25 bg-red-400/10 text-red-200"
          }`}
        >
          {toast.message}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          ["Open", summary.open, "text-cyan-200"],
          ["Reviewed", summary.reviewed, "text-violet-200"],
          ["Closed", summary.closed, "text-emerald-200"],
        ].map(([label, value, className]) => (
          <div
            key={label}
            className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5 backdrop-blur-xl"
          >
            <p className="text-sm text-zinc-500">{label}</p>
            <p className={`mt-2 text-3xl font-semibold ${className}`}>
              {value}
            </p>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-4 backdrop-blur-xl">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {[
              ["open", "Open"],
              ["reviewed", "In Progress"],
              ["closed", "Resolved"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setTab(value as "open" | "reviewed" | "closed")}
                className={`rounded-xl px-3 py-2 text-xs font-medium transition ${
                  tab === value
                    ? "bg-cyan-400/15 text-cyan-200 ring-1 ring-cyan-400/25"
                    : "bg-white/[0.04] text-zinc-400 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="grid gap-2 sm:grid-cols-[1fr_12rem]">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search tickets"
              className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-600"
            />
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value as typeof category)}
              className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none"
            >
              <option value="all" className="bg-[#09031f]">All categories</option>
              <option value="bug_report" className="bg-[#09031f]">Bug</option>
              <option value="feature_request" className="bg-[#09031f]">Feature</option>
              <option value="general_feedback" className="bg-[#09031f]">General</option>
            </select>
          </div>
        </div>
      </section>

      {isLoading ? (
        <div className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-8 text-center text-sm text-zinc-400">
          Loading feedback...
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-8 text-center">
          <p className="text-lg font-semibold text-white">No feedback yet</p>
          <p className="mt-2 text-sm text-zinc-500">
            No tickets match this view.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTickets.map((ticket) => {
            const draft = drafts[ticket.id] ?? {
              status: ticket.status,
              adminReply: ticket.adminReply ?? "",
            };

            return (
              <article
                key={ticket.id}
                className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-5 shadow-xl shadow-black/10 backdrop-blur-xl"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-medium ${feedbackCategoryClasses(
                          ticket.category
                        )}`}
                      >
                        {ticket.categoryLabel}
                      </span>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-medium ${feedbackStatusClasses(
                          ticket.status
                        )}`}
                      >
                        {formatFeedbackStatus(ticket.status)}
                      </span>
                    </div>
                    <h2 className="mt-4 text-xl font-semibold text-white">
                      {ticket.subject}
                    </h2>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-400">
                      {ticket.message}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/[0.08] bg-black/10 p-4 text-sm lg:w-72">
                    <p className="font-medium text-white">{ticket.userName}</p>
                    <p className="mt-1 break-all text-zinc-500">{ticket.email}</p>
                    <p className="mt-3 text-xs text-zinc-600">
                      Created {formatFeedbackTime(ticket.createdAt)}
                    </p>
                    {ticket.screenshotUrl && (
                      <a
                        href={ticket.screenshotUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex text-xs font-medium text-cyan-300 transition hover:text-cyan-200"
                      >
                        View screenshot
                      </a>
                    )}
                  </div>
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_12rem_auto] lg:items-end">
                  <label className="block">
                    <span className="text-sm font-medium text-zinc-200">
                      Admin reply
                    </span>
                    <textarea
                      value={draft.adminReply}
                      onChange={(event) =>
                        updateDraft(ticket.id, {
                          adminReply: event.target.value,
                        })
                      }
                      rows={4}
                      maxLength={2000}
                      placeholder="Write a clear reply for the user..."
                      className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium text-zinc-200">
                      Status
                    </span>
                    <select
                      value={draft.status}
                      onChange={(event) =>
                        updateDraft(ticket.id, {
                          status: event.target.value as FeedbackStatus,
                        })
                      }
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
                    >
                      {STATUSES.map((status) => (
                        <option key={status} value={status} className="bg-[#09031f]">
                          {formatFeedbackStatus(status)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <button
                    type="button"
                    onClick={() => void saveTicket(ticket.id)}
                    disabled={savingId === ticket.id}
                    className="rounded-2xl bg-gradient-to-r from-cyan-400 to-violet-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
                  >
                    {savingId === ticket.id ? "Saving..." : "Save Reply"}
                  </button>
                </div>

                {ticket.adminReply && (
                  <div className="mt-4 rounded-2xl border border-violet-400/20 bg-violet-400/10 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-200">
                      Current Reply
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
                      {ticket.adminReply}
                    </p>
                    <p className="mt-2 text-xs text-zinc-500">
                      Replied {formatFeedbackTime(ticket.repliedAt)}
                    </p>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
