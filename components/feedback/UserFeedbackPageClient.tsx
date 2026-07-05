"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MessageSquareHeart } from "lucide-react";
import FeedbackForm from "@/components/feedback/FeedbackForm";
import FeedbackSuccessAnimation from "@/components/feedback/FeedbackSuccessAnimation";
import {
  feedbackCategoryClasses,
  feedbackStatusClasses,
  formatFeedbackStatus,
  formatFeedbackTime,
  formatRatingStars,
  getRatingLabel,
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
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const loadTickets = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/feedback", { cache: "no-store" });
      const payload = (await response.json().catch(() => ({}))) as FeedbackResponse;

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
  }, []);

  useEffect(() => {
    void loadTickets();
  }, [loadTickets]);

  const sortedTickets = useMemo(() => {
    if (!selectedTicketId) return tickets;
    return [...tickets].sort((a, b) => {
      if (a.id === selectedTicketId) return -1;
      if (b.id === selectedTicketId) return 1;
      return 0;
    });
  }, [selectedTicketId, tickets]);

  async function submitFeedback(formData: FormData): Promise<boolean> {
    if (submitting) return false;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch("/api/beta-feedback", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to submit feedback.");
      }

      setShowSuccess(true);
      await loadTickets();
      window.setTimeout(() => setShowSuccess(false), 4500);
      return true;
    } catch (submitErr) {
      setSubmitError(
        submitErr instanceof Error
          ? submitErr.message
          : "Unable to submit feedback. Please try again."
      );
      return false;
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.05] via-violet-500/[0.04] to-cyan-400/[0.03] p-5 shadow-2xl shadow-violet-950/20 backdrop-blur-xl sm:p-7">
        <div className="mb-6 flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 via-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/25">
            <MessageSquareHeart className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
              Share your experience
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
              Rate your experience, tell us what&apos;s working, and help shape
              the future of Advora AI.
            </p>
          </div>
        </div>

        {showSuccess ? (
          <FeedbackSuccessAnimation />
        ) : (
          <>
            {submitError ? (
              <div
                role="alert"
                className="mb-5 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200"
              >
                {submitError}
              </div>
            ) : null}
            <FeedbackForm submitting={submitting} onSubmit={submitFeedback} />
          </>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Your feedback history</h3>
          <p className="mt-1 text-sm text-zinc-500">
            Track submissions and replies from the Advora team.
          </p>
        </div>

        {isLoading ? (
          <div className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-8 text-center text-sm text-zinc-400">
            Loading your feedback threads...
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-400/20 bg-red-400/10 p-6 text-sm text-red-200">
            {error}
          </div>
        ) : sortedTickets.length === 0 ? (
          <div className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-8 text-center">
            <p className="text-base font-semibold text-white">No submissions yet</p>
            <p className="mt-2 text-sm text-zinc-500">
              Your submitted feedback will appear here with status updates and team replies.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedTickets.map((ticket) => {
              const highlighted = ticket.id === selectedTicketId;
              return (
                <article
                  key={ticket.id}
                  className={`rounded-3xl border p-5 shadow-xl shadow-black/10 backdrop-blur-xl transition ${
                    highlighted
                      ? "border-cyan-400/30 bg-cyan-400/[0.06]"
                      : "border-white/[0.08] bg-white/[0.04]"
                  }`}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
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
                      <h4 className="mt-4 text-xl font-semibold text-white">
                        {ticket.subject}
                      </h4>
                      <p className="mt-2 text-xs text-zinc-500">
                        Submitted {formatFeedbackTime(ticket.createdAt)}
                      </p>
                    </div>
                    {ticket.screenshotUrl ? (
                      <a
                        href={ticket.screenshotUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex shrink-0 items-center justify-center rounded-xl border border-cyan-400/25 bg-cyan-400/10 px-4 py-2.5 text-xs font-medium text-cyan-200 transition hover:border-cyan-300/40"
                      >
                        View screenshot
                      </a>
                    ) : null}
                  </div>

                  <div className="mt-5 grid gap-4 lg:grid-cols-2">
                    <section className="rounded-2xl border border-white/[0.08] bg-black/10 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Your feedback
                      </p>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
                        {ticket.message}
                      </p>
                    </section>

                    <section className="rounded-2xl border border-violet-400/20 bg-violet-400/10 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-200">
                        Advora team reply
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
                          We haven&apos;t replied yet. Your feedback is in the queue.
                        </p>
                      )}
                    </section>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
