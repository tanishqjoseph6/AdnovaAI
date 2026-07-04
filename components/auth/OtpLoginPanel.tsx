"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { useAuthToast } from "@/components/auth/AuthToast";
import OtpInput from "@/components/auth/OtpInput";
import { mapAuthErrorMessage, LOGIN_OTP_UNVERIFIED_MESSAGE } from "@/lib/auth/errors";
import {
  isCompleteOtp,
  OTP_RESEND_COOLDOWN_SECONDS,
} from "@/lib/auth/otp-login";
import { isValidEmail, normalizeEmail } from "@/lib/auth/validation";

type OtpStep = "email" | "verify";

export default function OtpLoginPanel() {
  const router = useRouter();
  const { showToast } = useAuthToast();
  const [step, setStep] = useState<OtpStep>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inFlightRef = useRef(false);

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setCooldown((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [cooldown]);

  const sendOtp = useCallback(
    async (targetEmail: string, isResend = false) => {
      if (inFlightRef.current || isSending) {
        return false;
      }

      if (isResend && cooldown > 0) {
        return false;
      }

      inFlightRef.current = true;
      setError(null);
      setIsSending(true);

      try {
        const response = await fetch("/api/auth/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: targetEmail }),
        });

        const payload = (await response.json()) as {
          error?: string;
          message?: string;
        };

        if (!response.ok) {
          const message = mapAuthErrorMessage(
            payload.error ?? "Unable to send code."
          );
          setError(message);
          showToast(message, "error");
          return false;
        }

        setStep("verify");
        setOtp("");
        setCooldown(OTP_RESEND_COOLDOWN_SECONDS);
        showToast(
          payload.message ?? "✅ Login code sent. Check your inbox.",
          "success"
        );
        return true;
      } catch {
        const message = "Unable to send verification code. Please try again.";
        setError(message);
        showToast(message, "error");
        return false;
      } finally {
        inFlightRef.current = false;
        setIsSending(false);
      }
    },
    [cooldown, isSending, showToast]
  );

  async function handleSendCode() {
    const normalized = normalizeEmail(email);
    if (!isValidEmail(normalized)) {
      const message = "Please enter a valid email address.";
      setError(message);
      showToast(message, "error");
      return;
    }

    setEmail(normalized);
    await sendOtp(normalized, false);
  }

  async function handleVerifyOtp(code: string) {
    if (!isCompleteOtp(code) || isVerifying) {
      return;
    }

    setError(null);
    setIsVerifying(true);

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token: code }),
      });

      const payload = (await response.json()) as {
        error?: string;
        requiresEmailVerification?: boolean;
      };

      if (!response.ok) {
        const message = mapAuthErrorMessage(payload.error ?? "Unable to verify code.");
        setError(message);
        showToast(message, "error");
        setOtp("");
        return;
      }

      showToast("Signed in successfully.", "success");

      if (payload.requiresEmailVerification) {
        router.refresh();
        router.push("/verify-email");
        return;
      }

      router.refresh();
      router.push("/dashboard");
    } catch {
      const message = "Unable to verify code. Please try again.";
      setError(message);
      showToast(message, "error");
      setOtp("");
    } finally {
      setIsVerifying(false);
    }
  }

  if (step === "verify") {
    return (
      <div className="space-y-5">
        <div className="text-center">
          <p className="text-sm text-zinc-400">
            Enter the 6-digit code sent to
          </p>
          <p className="mt-1 text-sm font-medium text-white">{email}</p>
        </div>

        <OtpInput
          value={otp}
          onChange={setOtp}
          disabled={isVerifying}
          onComplete={(code) => void handleVerifyOtp(code)}
        />

        {error && (
          <p
            role="alert"
            className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300"
          >
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={() => void handleVerifyOtp(otp)}
          disabled={isVerifying || !isCompleteOtp(otp)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isVerifying ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Verifying…
            </>
          ) : (
            "Verify & sign in"
          )}
        </button>

        <div className="text-center text-sm text-zinc-500">
          {cooldown > 0 ? (
            <p>
              Resend code in{" "}
              <span className="font-medium text-zinc-300">{cooldown}s</span>
            </p>
          ) : (
            <button
              type="button"
              onClick={() => void sendOtp(email, true)}
              disabled={isSending}
              className="inline-flex items-center justify-center gap-2 font-medium text-cyan-300 transition hover:text-cyan-200 disabled:opacity-50"
            >
              {isSending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                  Sending…
                </>
              ) : (
                "Resend code"
              )}
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            setStep("email");
            setOtp("");
            setError(null);
            setCooldown(0);
          }}
          className="w-full text-center text-sm text-zinc-500 transition hover:text-zinc-300"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-400">
        We&apos;ll email a 6-digit login code to your verified account.
      </p>

      <input
        type="email"
        autoComplete="email"
        inputMode="email"
        className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-violet-500/50 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
        placeholder="Email address"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300"
        >
          <p>{error}</p>
          {error === LOGIN_OTP_UNVERIFIED_MESSAGE && (
            <p className="mt-2">
              <Link
                href={`/verify-email?email=${encodeURIComponent(normalizeEmail(email))}`}
                className="font-medium text-cyan-300 hover:text-cyan-200"
              >
                Resend verification email
              </Link>
            </p>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => void handleSendCode()}
        disabled={isSending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Sending code…
          </>
        ) : (
          "Send login code"
        )}
      </button>

      <p className="text-center text-sm text-zinc-500">
        New to Advora?{" "}
        <Link href="/signup" className="text-cyan-300 hover:text-cyan-200">
          Create an account
        </Link>
      </p>

      <p className="text-center text-sm text-zinc-500">
        <Link href="/login" className="text-cyan-300 hover:text-cyan-200">
          Use password instead
        </Link>
      </p>
    </div>
  );
}
