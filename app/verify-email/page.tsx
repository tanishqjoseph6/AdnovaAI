"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { Loader2, MailCheck } from "lucide-react";
import { mapAuthErrorMessage } from "@/lib/auth/errors";
import { isEmailVerified } from "@/lib/auth/email-verified";
import { isValidEmail, normalizeEmail } from "@/lib/auth/validation";
import { invalidateCreditsCache } from "@/hooks/useCredits";
import { supabase } from "@/lib/supabase";

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [hasSession, setHasSession] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const checkVerification = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    setHasSession(Boolean(user));

    if (user?.email) {
      setEmail(user.email);
    }

    if (user && isEmailVerified(user)) {
      router.refresh();
      router.replace("/dashboard");
    }
  }, [router]);

  useEffect(() => {
    const emailFromQuery = searchParams.get("email");
    if (emailFromQuery) {
      setEmail(emailFromQuery);
    }

    void checkVerification();

    const interval = window.setInterval(() => {
      void checkVerification();
    }, 5000);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void checkVerification();
    });

    return () => {
      window.clearInterval(interval);
      subscription.unsubscribe();
    };
  }, [checkVerification, searchParams]);

  async function handleResend(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    const normalized = normalizeEmail(email);
    if (!isValidEmail(normalized)) {
      setError("Enter the email address you used to sign up.");
      return;
    }

    setIsResending(true);

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalized }),
      });

      const payload = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        setError(mapAuthErrorMessage(payload.error ?? "Unable to resend email."));
        return;
      }

      setMessage(payload.message ?? "Verification email sent.");
    } catch {
      setError("Unable to resend verification email. Please try again.");
    } finally {
      setIsResending(false);
    }
  }

  async function handleSignOut() {
    setIsSigningOut(true);
    invalidateCreditsCache();
    await supabase.auth.signOut();
    router.refresh();
    router.push("/login");
  }

  return (
    <div className="glass w-full max-w-md rounded-2xl border border-white/10 p-6 shadow-xl shadow-violet-500/10 sm:p-8">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 via-violet-500/20 to-fuchsia-500/20">
        <MailCheck className="h-7 w-7 text-cyan-300" aria-hidden />
      </div>

      <h1 className="mt-6 text-center text-2xl font-bold text-white sm:text-3xl">
        Verify your email
      </h1>
      <p className="mt-3 text-center text-sm leading-relaxed text-zinc-400">
        We sent a confirmation link to your inbox. Verify your email to activate
        your account and receive free credits.
      </p>

      <form className="mt-8 space-y-4" onSubmit={(event) => void handleResend(event)}>
        <input
          type="email"
          autoComplete="email"
          className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-violet-500/50 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
          placeholder="Email address"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        {error && (
          <p
            role="alert"
            className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300"
          >
            {error}
          </p>
        )}

        {message && (
          <p
            role="status"
            className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
          >
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={isResending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isResending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Sending…
            </>
          ) : (
            "Resend verification email"
          )}
        </button>

        {hasSession ? (
          <button
            type="button"
            onClick={() => void handleSignOut()}
            disabled={isSigningOut}
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-medium text-zinc-300 transition hover:bg-white/[0.06] disabled:opacity-60"
          >
            {isSigningOut ? "Signing out…" : "Sign out"}
          </button>
        ) : null}

        <p className="text-center text-sm text-zinc-500">
          Already verified?{" "}
          <Link href="/login" className="text-cyan-300 hover:text-cyan-200">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#030014] px-4 py-8">
      <Suspense fallback={<div className="text-zinc-400">Loading…</div>}>
        <VerifyEmailForm />
      </Suspense>
    </div>
  );
}
