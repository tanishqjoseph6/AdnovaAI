"use client";

import {
  useEffect,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  Loader2,
  MessageSquarePlus,
  Sparkles,
  X,
  XCircle,
} from "lucide-react";
import FeedbackForm from "@/components/feedback/FeedbackForm";
import FeedbackSuccessAnimation from "@/components/feedback/FeedbackSuccessAnimation";
import type { FeedbackCategory } from "@/lib/feedback/validation";

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
  category: FeedbackCategory;
}> = [
  { label: "🐞 Report Bug", category: "bug_report" },
  { label: "💡 Feature Request", category: "feature_request" },
  { label: "❤️ Share Feedback", category: "general_feedback" },
];

const INITIAL_CATEGORY: FeedbackCategory = "general_feedback";

export function openFeedbackModal(category: FeedbackCategory = INITIAL_CATEGORY) {
  if (typeof window === "undefined") return;

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
  showSuccess,
  onClose,
  onSubmit,
}: {
  open: boolean;
  initialCategory: FeedbackCategory;
  submitting: boolean;
  showSuccess: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => Promise<boolean>;
}) {
  const [category, setCategory] = useState<FeedbackCategory>(initialCategory);

  useEffect(() => {
    if (!open) return;
    setCategory(initialCategory);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !submitting) onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [initialCategory, onClose, open, submitting]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-end justify-center bg-black/70 p-3 backdrop-blur-sm sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !submitting) onClose();
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="beta-feedback-title"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 360, damping: 34 }}
            className="max-h-[calc(100dvh-1.5rem)] w-full max-w-xl overflow-y-auto rounded-3xl border border-white/10 bg-[#09031f]/95 p-5 shadow-2xl shadow-violet-950/40 outline-none backdrop-blur-2xl sm:p-6"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                  Feedback
                </p>
                <h2
                  id="beta-feedback-title"
                  className="mt-2 text-2xl font-semibold tracking-tight text-white"
                >
                  Help improve Advora AI
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="rounded-full border border-white/10 bg-white/[0.04] p-2 text-zinc-400 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white disabled:opacity-60"
                aria-label="Close feedback modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {showSuccess ? (
              <FeedbackSuccessAnimation />
            ) : (
              <FeedbackForm
                initialCategory={category}
                submitting={submitting}
                onSubmit={onSubmit}
                compact
              />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function FeedbackLauncher() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [initialCategory, setInitialCategory] =
    useState<FeedbackCategory>(INITIAL_CATEGORY);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    function handleOpenFeedback(event: Event) {
      const detail = (event as CustomEvent<FeedbackOpenDetail>).detail;
      setInitialCategory(detail?.category ?? INITIAL_CATEGORY);
      setMenuOpen(false);
      setShowSuccess(false);
      setModalOpen(true);
    }

    window.addEventListener(OPEN_FEEDBACK_EVENT, handleOpenFeedback);
    return () => window.removeEventListener(OPEN_FEEDBACK_EVENT, handleOpenFeedback);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  function openCategory(category: FeedbackCategory) {
    setInitialCategory(category);
    setMenuOpen(false);
    setShowSuccess(false);
    setModalOpen(true);
  }

  async function submitFeedback(formData: FormData): Promise<boolean> {
    if (submitting) return false;

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

      setShowSuccess(true);
      window.setTimeout(() => {
        setModalOpen(false);
        setShowSuccess(false);
      }, 3200);
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
              {MENU_OPTIONS.map((option) => (
                <button
                  key={option.category}
                  type="button"
                  onClick={() => openCategory(option.category)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-zinc-200 transition hover:bg-white/[0.07] hover:text-white"
                >
                  {option.label}
                </button>
              ))}
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
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin text-cyan-200" />
            ) : (
              <MessageSquarePlus className="h-4 w-4 text-cyan-200" />
            )}
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
        showSuccess={showSuccess}
        onClose={() => {
          if (!submitting) {
            setModalOpen(false);
            setShowSuccess(false);
          }
        }}
        onSubmit={submitFeedback}
      />
      <FeedbackToast toast={toast} onDismiss={() => setToast(null)} />
    </>
  );
}
