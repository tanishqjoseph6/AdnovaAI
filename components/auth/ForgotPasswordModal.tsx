"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, X } from "lucide-react";
import { useAuthToast } from "@/components/auth/AuthToast";
import { mapAuthErrorMessage } from "@/lib/auth/errors";
import {
  FORGOT_PASSWORD_ERROR_MESSAGE,
  FORGOT_PASSWORD_SUCCESS_MESSAGE,
  INVALID_EMAIL_MESSAGE,
} from "@/lib/auth/password-reset";
import { isValidEmail, normalizeEmail } from "@/lib/auth/validation";
import { usePasswordResetCooldown } from "@/hooks/usePasswordResetCooldown";

type ForgotPasswordModalProps = {
  open: boolean;
  onClose: () => void;
  initialEmail?: string;
};

export default function ForgotPasswordModal({
  open,
  onClose,
  initialEmail = "",
}: ForgotPasswordModalProps) {
  const { showToast } = useAuthToast();
  const [email, setEmail] = useState(initialEmail);
  const [isSending, setIsSending] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const inFlightRef = useRef(false);
  const normalizedEmail = normalizeEmail(email);
  const { secondsLeft, isOnCooldown, startCooldown } =
    usePasswordResetCooldown(normalizedEmail);

  useEffect(() => {
    if (open) {
      setEmail(initialEmail);
      setFieldError(null);
    }
  }, [open, initialEmail]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (inFlightRef.current || isSending || isOnCooldown) {
      return;
    }

    const normalized = normalizeEmail(email);
    setFieldError(null);

    if (!normalized || !isValidEmail(normalized)) {
      setFieldError(INVALID_EMAIL_MESSAGE);
      showToast(INVALID_EMAIL_MESSAGE, "error");
      return;
    }

    inFlightRef.current = true;
    setIsSending(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalized }),
      });

      const payload = (await response.json()) as {
        error?: string;
        message?: string;
      };

      if (!response.ok) {
        const message = mapAuthErrorMessage(
          payload.error ?? FORGOT_PASSWORD_ERROR_MESSAGE
        );
        setFieldError(message);
        showToast(message, "error");
        return;
      }

      showToast(payload.message ?? FORGOT_PASSWORD_SUCCESS_MESSAGE, "success");
      startCooldown();
      onClose();
    } catch (error) {
      console.error("[ForgotPasswordModal] Request failed:", error);
      setFieldError(FORGOT_PASSWORD_ERROR_MESSAGE);
      showToast(FORGOT_PASSWORD_ERROR_MESSAGE, "error");
    } finally {
      inFlightRef.current = false;
      setIsSending(false);
    }
  }

  const isDisabled = isSending || isOnCooldown;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            aria-label="Close dialog"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="forgot-password-title"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0a0618] p-6 shadow-2xl shadow-violet-500/20 sm:p-8"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-zinc-400 transition hover:bg-white/10 hover:text-white"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <h2
              id="forgot-password-title"
              className="text-xl font-semibold text-white sm:text-2xl"
            >
              Reset your password
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              Enter your email and we&apos;ll send you a secure link to choose a
              new password.
            </p>

            <form
              className="mt-6 space-y-4"
              onSubmit={(event) => void handleSubmit(event)}
            >
              <div>
                <input
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    if (fieldError) {
                      setFieldError(null);
                    }
                  }}
                  aria-invalid={fieldError ? true : undefined}
                  aria-describedby={fieldError ? "forgot-password-error" : undefined}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-violet-500/50 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                />
                {fieldError && (
                  <p
                    id="forgot-password-error"
                    role="alert"
                    className="mt-2 text-sm text-red-300"
                  >
                    {fieldError}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isDisabled}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Sending reset link…
                  </>
                ) : isOnCooldown ? (
                  `Resend available in ${secondsLeft}s`
                ) : (
                  "Send reset link"
                )}
              </button>

              {isOnCooldown && !isSending && (
                <p className="text-center text-xs text-zinc-500">
                  Check your inbox and spam folder. You can request another link
                  in {secondsLeft} second{secondsLeft === 1 ? "" : "s"}.
                </p>
              )}
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
