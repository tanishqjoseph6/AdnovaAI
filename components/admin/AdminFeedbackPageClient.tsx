"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import FeedbackAnalyticsPanel from "@/components/admin/FeedbackAnalyticsPanel";
import {
  feedbackCategoryClasses,
  feedbackStatusClasses,
  formatFeedbackStatus,
  formatFeedbackTime,
  formatRatingStars,
  getRatingLabel,
  type AdminFeedbackTicketView,
} from "@/lib/feedback/client";
import {
  FEEDBACK_CATEGORIES,
  FEEDBACK_REACTIONS,
  getFeedbackCategoryLabel,
  getFeedbackReactionLabel,
  type FeedbackCategory,
  type FeedbackReaction,
} from "@/lib/feedback/validation";
import {
  FEEDBACK_STATUSES,
  type FeedbackAnalytics,
  type FeedbackStatus,
} from "@/lib/feedback/server";

type Draft = {
  status: FeedbackStatus;
  adminReply: string;
};

type SortOption = "created_desc" | "created_asc" | "rating_desc" | "rating_asc";

export default function AdminFeedbackPageClient() {
  const [tickets, setTickets] = useState<AdminFeedbackTicketView[]>([]);
  const [analytics, setAnalytics] = useState<FeedbackAnalytics | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [status, setStatus] = useState<FeedbackStatus | "all">("all");
  const [category, setCategory] = useState<FeedbackCategory | "all">("all");
  const [rating, setRating] = useState<"all" | "1" | "2" | "3" | "4" | "5">("all");
  const [reaction, setReaction] = useState<FeedbackReaction | "all">("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("created_desc");
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const loadAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const response = await fetch("/api/admin/feedback/analytics", {
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => ({}))) as {
        analytics?: FeedbackAnalytics;
      };
      if (response.ok) {
        setAnalytics(payload.analytics ?? null);
      }
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  const loadTickets = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (status !== "all") params.set("status", status);
      if (category !== "all") params.set("category", category);
      if (rating !== "all") params.set("rating", rating);
      if (reaction !== "all") params.set("reaction", reaction);
      if (search.trim()) params.set("q", search.trim());
      params.set("sort", sort);

      const response = await fetch(`/api/admin/feedback?${params.toString()}`, {
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => ({}))) as {
        tickets?: AdminFeedbackTicketView[];
        error?: string;
      };

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
          error instanceof Error ? error.message : "Unable to load feedback.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [category, rating, reaction, search, sort, status]);

  useEffect(() => {
    void loadAnalytics();
  }, [loadAnalytics]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadTickets();
    }, 250);
    return () => window.clearTimeout(timer);
  }, [loadTickets]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const summary = useMemo(() => {
    if (analytics?.statusCounts) {
      return analytics.statusCounts;
    }

    return Object.fromEntries(
      FEEDBACK_STATUSES.map((value) => [value, 0])
    ) as Record<FeedbackStatus, number>;
  }, [analytics]);

  function updateDraft(ticketId: string, patch: Partial<Draft>) {
    setDrafts((current) => ({
      ...current,
      [ticketId]: {
        status: current[ticketId]?.status ?? "new",
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
      void loadAnalytics();
      setToast({
        type: "success",
        message: draft.adminReply.trim()
          ? "Feedback updated and user notified."
          : "Feedback status updated.",
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
    <div className="space-y-8">
      {toast ? (
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
      ) : null}

      <FeedbackAnalyticsPanel analytics={analytics} isLoading={analyticsLoading} />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {FEEDBACK_STATUSES.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setStatus(value)}
            className={`rounded-2xl border p-4 text-left transition ${
              status === value
                ? "border-violet-400/30 bg-violet-400/10"
                : "border-white/[0.08] bg-white/[0.04] hover:border-white/15"
            }`}
          >
            <p className="text-xs text-zinc-500">{formatFeedbackStatus(value)}</p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {summary[value]}
            </p>
          </button>
        ))}
      </section>

      <section className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-4 backdrop-blur-xl">
        <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-6">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search feedback"
            className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 xl:col-span-2"
          />
          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as FeedbackStatus | "all")
            }
            className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none"
          >
            <option value="all" className="bg-[#09031f]">All statuses</option>
            {FEEDBACK_STATUSES.map((value) => (
              <option key={value} value={value} className="bg-[#09031f]">
                {formatFeedbackStatus(value)}
              </option>
            ))}
          </select>
          <select
            value={category}
            onChange={(event) =>
              setCategory(event.target.value as FeedbackCategory | "all")
            }
            className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none"
          >
            <option value="all" className="bg-[#09031f]">All categories</option>
            {FEEDBACK_CATEGORIES.map((value) => (
              <option key={value} value={value} className="bg-[#09031f]">
                {getFeedbackCategoryLabel(value)}
              </option>
            ))}
          </select>
          <select
            value={rating}
            onChange={(event) =>
              setRating(event.target.value as typeof rating)
            }
            className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none"
          >
            <option value="all" className="bg-[#09031f]">All ratings</option>
            {(["5", "4", "3", "2", "1"] as const).map((value) => (
              <option key={value} value={value} className="bg-[#09031f]">
                {value} stars
              </option>
            ))}
          </select>
          <select
            value={reaction}
            onChange={(event) =>
              setReaction(event.target.value as FeedbackReaction | "all")
            }
            className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none"
          >
            <option value="all" className="bg-[#09031f]">All reactions</option>
            {FEEDBACK_REACTIONS.map((value) => (
              <option key={value} value={value} className="bg-[#09031f]">
                {getFeedbackReactionLabel(value)}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as SortOption)}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none"
          >
            <option value="created_desc" className="bg-[#09031f]">Newest first</option>
            <option value="created_asc" className="bg-[#09031f]">Oldest first</option>
            <option value="rating_desc" className="bg-[#09031f]">Highest rating</option>
            <option value="rating_asc" className="bg-[#09031f]">Lowest rating</option>
          </select>
        </div>
      </section>

      {isLoading ? (
        <div className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-8 text-center text-sm text-zinc-400">
          Loading feedback...
        </div>
      ) : tickets.length === 0 ? (
        <div className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-8 text-center">
          <p className="text-lg font-semibold text-white">No feedback found</p>
          <p className="mt-2 text-sm text-zinc-500">
            No tickets match the current filters.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => {
            const draft = drafts[ticket.id] ?? {
              status: ticket.status,
              adminReply: ticket.adminReply ?? "",
            };

            return (
              <article
                key={ticket.id}
                className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-5 shadow-xl shadow-black/10 backdrop-blur-xl"
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
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
                      <span className="rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-200">
                        {formatRatingStars(ticket.rating)} {getRatingLabel(ticket.rating)}
                      </span>
                      {ticket.reactionLabel ? (
                        <span className="rounded-full border border-violet-400/25 bg-violet-400/10 px-3 py-1 text-xs font-medium text-violet-200">
                          {ticket.reactionLabel}
                        </span>
                      ) : null}
                    </div>
                    <h2 className="mt-4 text-xl font-semibold text-white">
                      {ticket.subject}
                    </h2>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-zinc-400">
                      {ticket.message}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/[0.08] bg-black/10 p-4 text-sm xl:w-72">
                    <p className="font-medium text-white">{ticket.userName}</p>
                    <p className="mt-1 break-all text-zinc-500">{ticket.email}</p>
                    <p className="mt-3 text-xs text-zinc-600">
                      {formatFeedbackTime(ticket.createdAt)}
                    </p>
                    {ticket.screenshotUrl ? (
                      <a
                        href={ticket.screenshotUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex text-xs font-medium text-cyan-300 transition hover:text-cyan-200"
                      >
                        View screenshot
                      </a>
                    ) : null}
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
                      {FEEDBACK_STATUSES.map((value) => (
                        <option key={value} value={value} className="bg-[#09031f]">
                          {formatFeedbackStatus(value)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <button
                    type="button"
                    onClick={() => void saveTicket(ticket.id)}
                    disabled={savingId === ticket.id}
                    className="rounded-2xl bg-gradient-to-r from-cyan-400 to-violet-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingId === ticket.id ? "Saving..." : "Save"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
