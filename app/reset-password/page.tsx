"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { KeyRound, Loader2 } from "lucide-react";
import { AuthToastProvider, useAuthToast } from "@/components/auth/AuthToast";
import PasswordInput from "@/components/auth/PasswordInput";
import { mapAuthErrorMessage } from "@/lib/auth/errors";
import {
  RESET_LINK_EXPIRED_MESSAGE,
  RESET_SUCCESS_MESSAGE,
  validateNewPassword,
} from "@/lib/auth/password-reset";
import { supabase } from "@/lib/supabase";

type ResetState = "loading" | "ready" | "invalid";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useAuthToast();
  const [state, setState] = useState<ResetState>("loading");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const urlError = searchParams.get("error");

    if (urlError) {
      setState("invalid");
      setError(mapAuthErrorMessage(urlError));
      return;
    }

    async function verifyRecoverySession() {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        setState("invalid");
        setError(RESET_LINK_EXPIRED_MESSAGE);
        return;
      }

      setState("ready");
    }

    void verifyRecoverySession();
  }, [searchParams]);

  async function handleSubmit() {
    setError(null);

    const validation = validateNewPassword(password, confirmPassword);
    if (!validation.ok) {
      setError(validation.error);
      return;
    }

    setIsSubmitting(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        const message = mapAuthErrorMessage(updateError.message);
        setError(message);
        showToast(message, "error");

        if (
          updateError.message.toLowerCase().includes("expired") ||
          updateError.message.toLowerCase().includes("invalid")
        ) {
          setState("invalid");
        }
        return;
      }

      await supabase.auth.signOut();
      showToast(RESET_SUCCESS_MESSAGE, "success");
      router.push("/login?reset=success");
    } catch {
      const message = "Unable to update password. Please try again.";
      setError(message);
      showToast(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (state === "loading") {
    return (
      <div className="glass flex w-full max-w-md flex-col items-center rounded-2xl border border-white/10 p-10 shadow-xl shadow-violet-500/10">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-300" aria-hidden />
        <p className="mt-4 text-sm text-zinc-400">Verifying reset link…</p>
      </div>
    );
  }

  if (state === "invalid") {
    return (
      <div className="glass w-full max-w-md rounded-2xl border border-white/10 p-8 shadow-xl shadow-violet-500/10">
        <h1 className="text-2xl font-bold text-white">Link expired</h1>
        <p className="mt-3 text-sm leading-relaxed text-red-300">
          {error ?? RESET_LINK_EXPIRED_MESSAGE}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">
          Password reset links expire for security. Request a new link from the
          sign-in page.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="glass w-full max-w-md rounded-2xl border border-white/10 p-8 shadow-xl shadow-violet-500/10">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 via-violet-500/20 to-fuchsia-500/20">
        <KeyRound className="h-7 w-7 text-cyan-300" aria-hidden />
      </div>

      <h1 className="mt-6 text-center text-2xl font-bold text-white">
        Choose a new password
      </h1>
      <p className="mt-2 text-center text-sm text-zinc-400">
        Enter a strong password for your Advora AI account.
      </p>

      <div className="mt-8 space-y-4">
        <PasswordInput
          placeholder="New password (min. 8 characters)"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 pr-11 text-sm text-white placeholder:text-zinc-500 focus:border-violet-500/50 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
        />

        <PasswordInput
          placeholder="Confirm new password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 pr-11 text-sm text-white placeholder:text-zinc-500 focus:border-violet-500/50 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
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
          onClick={() => void handleSubmit()}
          disabled={isSubmitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Updating password…
            </>
          ) : (
            "Update password"
          )}
        </button>

        <p className="text-center text-sm text-zinc-500">
          <Link href="/login" className="text-cyan-300 hover:text-cyan-200">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthToastProvider>
      <div className="flex min-h-screen items-center justify-center bg-[#030014] px-4 py-10">
        <Suspense
          fallback={
            <div className="text-sm text-zinc-400">Loading reset form…</div>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </div>
    </AuthToastProvider>
  );
}
