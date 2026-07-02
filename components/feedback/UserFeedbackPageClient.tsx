"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  feedbackCategoryClasses,
  feedbackStatusClasses,
  formatFeedbackStatus,
  formatFeedbackTime,
  type FeedbackTicketView,
} from "@/lib/feedback/client";

type FeedbackResponse = {
  tickets?: FeedbackTicketView[];
  error?: string;
};

export default function UserFeedbackPageClient() {
  const searchParams = useSearchParams();
  const selectedTicketId = searchParams.get("ticket");
  const [tickets, setTickets] = useState<FeedbackTicketView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTickets() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/feedback", { cache: "no-store" });
        const payload = (await response.json().catch(() => ({}))) as
          FeedbackResponse;

        if (!response.ok) {
          throw new Error(payload.error ?? "Unable to load feedback.");
        }

        setTickets(payload.tickets ?? []);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load feedback."
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadTickets();
  }, []);

  const sortedTickets = useMemo(() => {
    if (!selectedTicketId) {
      return tickets;
    }

    return [...tickets].sort((a, b) => {
      if (a.id === selectedTicketId) return -1;
      if (b.id === selectedTicketId) return 1;
      return 0;
    });
  }, [selectedTicketId, tickets]);

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-8 text-center text-sm text-zinc-400">
        Loading your feedback threads...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-red-400/20 bg-red-400/10 p-6 text-sm text-red-200">
        {error}
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-8 text-center">
        <p className="text-lg font-semibold text-white">No feedback submitted yet</p>
        <p className="mt-2 text-sm text-zinc-500">
          Use the floating Feedback button to report bugs, share ideas, or
          request features.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sortedTickets.map((ticket) => {
        const highlighted = ticket.id === selectedTicketId;
        return (
          <article
            key={ticket.id}
            className={`rounded-3xl border p-5 shadow-xl shadow-black/10 backdrop-blur-xl ${
              highlighted
                ? "border-cyan-400/30 bg-cyan-400/[0.06]"
                : "border-white/[0.08] bg-white/[0.04]"
            }`}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
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
                <p className="mt-2 text-xs text-zinc-500">
                  Submitted {formatFeedbackTime(ticket.createdAt)}
                </p>
              </div>
              {ticket.screenshotUrl && (
                <a
                  href={ticket.screenshotUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl border border-cyan-400/25 bg-cyan-400/10 px-3 py-2 text-center text-xs font-medium text-cyan-200 transition hover:border-cyan-300/40"
                >
                  View Screenshot
                </a>
              )}
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <section className="rounded-2xl border border-white/[0.08] bg-black/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  Your Feedback
                </p>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
                  {ticket.message}
                </p>
              </section>

              <section className="rounded-2xl border border-violet-400/20 bg-violet-400/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-200">
                  Advora Team Reply
                </p>
                {ticket.adminReply ? (
                  <>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-zinc-200">
                      {ticket.adminReply}
                    </p>
                    <p className="mt-3 text-xs text-zinc-500">
                      Replied {formatFeedbackTime(ticket.repliedAt)}
                    </p>
                  </>
                ) : (
                  <p className="mt-3 text-sm leading-relaxed text-zinc-500">
                    We haven&apos;t replied yet. Your feedback is in the queue
                    and will be reviewed by the Advora team.
                  </p>
                )}
              </section>
            </div>
          </article>
        );
      })}
    </div>
  );
}
