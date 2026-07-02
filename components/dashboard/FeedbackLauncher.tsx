"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bug,
  CheckCircle2,
  Lightbulb,
  Loader2,
  MessageSquarePlus,
  Sparkles,
  Star,
  Upload,
  X,
  XCircle,
} from "lucide-react";
import {
  FEEDBACK_CATEGORIES,
  getFeedbackCategoryLabel,
  type FeedbackCategory,
} from "@/lib/feedback/validation";

export const OPEN_FEEDBACK_EVENT = "advora:open-feedback";

type Toast = {
  message: string;
  type: "success" | "error";
};

type FeedbackOpenDetail = {
  category?: FeedbackCategory;
};

const MENU_OPTIONS: Array<{
  label: string;
  icon: typeof Bug;
  category: FeedbackCategory;
}> = [
  { label: "🐞 Report Bug", icon: Bug, category: "bug_report" },
  { label: "💡 Send Feedback", icon: Lightbulb, category: "general_feedback" },
  { label: "⭐ Request Feature", icon: Star, category: "feature_request" },
];

const INITIAL_CATEGORY: FeedbackCategory = "general_feedback";

export function openFeedbackModal(category: FeedbackCategory = INITIAL_CATEGORY) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<FeedbackOpenDetail>(OPEN_FEEDBACK_EVENT, {
      detail: { category },
    })
  );
}

function FeedbackToast({
  toast,
  onDismiss,
}: {
  toast: Toast | null;
  onDismiss: () => void;
}) {
  return (
    <div className="pointer-events-none fixed bottom-24 right-4 z-[100] w-[calc(100%-2rem)] sm:bottom-28 sm:right-6 sm:w-auto">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            role={toast.type === "error" ? "alert" : "status"}
            className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 shadow-xl shadow-black/30 backdrop-blur-xl ${
              toast.type === "success"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                : "border-red-500/30 bg-red-500/10 text-red-200"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
            ) : (
              <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
            )}
            <p className="flex-1 text-sm leading-relaxed">{toast.message}</p>
            <button
              type="button"
              onClick={onDismiss}
              className="shrink-0 rounded-lg p-1 text-zinc-400 transition hover:bg-white/10 hover:text-white"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FeedbackModal({
  open,
  initialCategory,
  submitting,
  onClose,
  onSubmit,
}: {
  open: boolean;
  initialCategory: FeedbackCategory;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => Promise<boolean>;
}) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const [category, setCategory] = useState<FeedbackCategory>(initialCategory);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    setCategory(initialCategory);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !submitting) {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    requestAnimationFrame(() => dialogRef.current?.focus());

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [initialCategory, onClose, open, submitting]);

  function handleScreenshotChange(event: ChangeEvent<HTMLInputElement>) {
    setScreenshot(event.target.files?.[0] ?? null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData();
    formData.set("category", category);
    formData.set("subject", subject);
    formData.set("message", message);
    if (screenshot) {
      formData.set("screenshot", screenshot);
    }

    const submitted = await onSubmit(formData);
    if (submitted) {
      setSubject("");
      setMessage("");
      setScreenshot(null);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !submitting) {
              onClose();
            }
          }}
        >
          <motion.div
            ref={dialogRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="beta-feedback-title"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 360, damping: 34 }}
            className="max-h-[calc(100dvh-2rem)] w-full max-w-xl overflow-y-auto rounded-3xl border border-white/10 bg-[#09031f]/95 p-5 shadow-2xl shadow-violet-950/40 outline-none backdrop-blur-2xl sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                  Beta Feedback
                </p>
                <h2
                  id="beta-feedback-title"
                  className="mt-2 text-2xl font-semibold tracking-tight text-white"
                >
                  Help improve Advora AI
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                  Share bugs, ideas, or rough edges. Screenshots are optional
                  but helpful.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="rounded-full border border-white/10 bg-white/[0.04] p-2 text-zinc-400 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Close feedback modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <label className="block">
                <span className="text-sm font-medium text-zinc-200">Category</span>
                <select
                  value={category}
                  onChange={(event) =>
                    setCategory(event.target.value as FeedbackCategory)
                  }
                  disabled={submitting}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {FEEDBACK_CATEGORIES.map((option) => (
                    <option key={option} value={option} className="bg-[#09031f]">
                      {getFeedbackCategoryLabel(option)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-zinc-200">Subject</span>
                <input
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  disabled={submitting}
                  required
                  minLength={3}
                  maxLength={120}
                  placeholder="Short summary"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-zinc-200">
                  Description
                </span>
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  disabled={submitting}
                  required
                  minLength={10}
                  maxLength={2000}
                  rows={5}
                  placeholder="Tell us what happened or what you would like to see."
                  className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm leading-relaxed text-white outline-none transition placeholder:text-zinc-600 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-zinc-200">
                  Screenshot Upload <span className="text-zinc-500">(optional)</span>
                </span>
                <span className="mt-2 flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-4 text-sm text-zinc-400 transition hover:border-cyan-400/40 hover:bg-cyan-400/[0.04]">
                  <Upload className="h-5 w-5 text-cyan-300" />
                  <span className="min-w-0 flex-1 truncate">
                    {screenshot ? screenshot.name : "PNG, JPG, or WebP up to 5MB"}
                  </span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleScreenshotChange}
                    disabled={submitting}
                    className="sr-only"
                  />
                </span>
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-violet-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:scale-[1.01] hover:shadow-violet-500/30 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Feedback"
                )}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function FeedbackLauncher() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [initialCategory, setInitialCategory] =
    useState<FeedbackCategory>(INITIAL_CATEGORY);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    function handleOpenFeedback(event: Event) {
      const detail = (event as CustomEvent<FeedbackOpenDetail>).detail;
      setInitialCategory(detail?.category ?? INITIAL_CATEGORY);
      setMenuOpen(false);
      setModalOpen(true);
    }

    window.addEventListener(OPEN_FEEDBACK_EVENT, handleOpenFeedback);
    return () => {
      window.removeEventListener(OPEN_FEEDBACK_EVENT, handleOpenFeedback);
    };
  }, []);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  function openCategory(category: FeedbackCategory) {
    setInitialCategory(category);
    setMenuOpen(false);
    setModalOpen(true);
  }

  async function submitFeedback(formData: FormData): Promise<boolean> {
    setSubmitting(true);
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

      setModalOpen(false);
      setToast({
        type: "success",
        message: "Thanks for the feedback. The Advora team will review it.",
      });
      return true;
    } catch (error) {
      setToast({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to submit feedback. Please try again.",
      });
      return false;
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="fixed bottom-4 right-4 z-[70] sm:bottom-6 sm:right-6">
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 420, damping: 30 }}
              className="mb-3 w-[calc(100vw-2rem)] max-w-xs overflow-hidden rounded-2xl border border-white/10 bg-[#09031f]/90 p-2 shadow-2xl shadow-violet-950/40 backdrop-blur-2xl"
            >
              {MENU_OPTIONS.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.category}
                    type="button"
                    onClick={() => openCategory(option.category)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-zinc-200 transition hover:bg-white/[0.07] hover:text-white"
                  >
                    <span className="rounded-lg bg-white/[0.06] p-2 text-cyan-300 ring-1 ring-white/10">
                      <Icon className="h-4 w-4" />
                    </span>
                    {option.label}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="button"
          onClick={() => setMenuOpen((current) => !current)}
          aria-expanded={menuOpen}
          className="group relative flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-cyan-400/80 via-violet-500/80 to-fuchsia-500/80 p-px shadow-2xl shadow-violet-950/40 transition hover:scale-[1.02]"
        >
          <span className="flex items-center gap-2 rounded-full bg-[#08021d]/90 px-4 py-3 text-sm font-semibold text-white backdrop-blur-2xl sm:px-5">
            <MessageSquarePlus className="h-4 w-4 text-cyan-200" />
            Feedback
            <Sparkles className="hidden h-3.5 w-3.5 text-violet-200 sm:block" />
          </span>
        </button>
      </div>

      {menuOpen && (
        <button
          type="button"
          className="fixed inset-0 z-[60] cursor-default bg-transparent"
          aria-label="Close feedback menu"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <FeedbackModal
        open={modalOpen}
        initialCategory={initialCategory}
        submitting={submitting}
        onClose={() => setModalOpen(false)}
        onSubmit={submitFeedback}
      />
      <FeedbackToast toast={toast} onDismiss={() => setToast(null)} />
    </>
  );
}
