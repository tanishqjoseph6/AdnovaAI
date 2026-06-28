"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { AuthToastProvider, useAuthToast } from "@/components/auth/AuthToast";
import ForgotPasswordModal from "@/components/auth/ForgotPasswordModal";
import LoginModeToggle, {
  type LoginMode,
} from "@/components/auth/LoginModeToggle";
import OtpLoginPanel from "@/components/auth/OtpLoginPanel";
import PasswordInput from "@/components/auth/PasswordInput";
import { mapAuthErrorMessage } from "@/lib/auth/errors";
import { RESET_SUCCESS_MESSAGE } from "@/lib/auth/password-reset";
import { useAuthPageGuard } from "@/lib/auth/use-auth-page-guard";
import { isValidEmail, normalizeEmail } from "@/lib/auth/validation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useAuthToast();
  useAuthPageGuard();
  const [mode, setMode] = useState<LoginMode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    searchParams.get("error")
      ? mapAuthErrorMessage(searchParams.get("error")!)
      : null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get("reset") === "success") {
      showToast(RESET_SUCCESS_MESSAGE, "success");
    }
  }, [searchParams, showToast]);

  function handleModeChange(nextMode: LoginMode) {
    setMode(nextMode);
    setError(null);
  }

  async function handleLogin(event?: React.FormEvent) {
    event?.preventDefault();
    setError(null);

    const normalized = normalizeEmail(email);
    if (!isValidEmail(normalized)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!password) {
      setError("Password is required.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalized, password }),
      });

      const payload = (await response.json()) as {
        error?: string;
        requiresEmailVerification?: boolean;
      };

      if (!response.ok) {
        setError(mapAuthErrorMessage(payload.error ?? "Unable to sign in."));
        return;
      }

      if (payload.requiresEmailVerification) {
        router.refresh();
        router.push("/verify-email");
        return;
      }

      router.refresh();
      router.push("/dashboard");
    } catch {
      setError("Unable to sign in. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <div className="glass w-full max-w-md rounded-2xl border border-white/10 p-6 shadow-xl shadow-violet-500/10 sm:p-8">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">
          Welcome back
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Sign in to your Advora AI account.
        </p>

        <div className="mt-6">
          <LoginModeToggle mode={mode} onChange={handleModeChange} />
        </div>

        <div className="mt-6">
          {mode === "otp" ? (
            <OtpLoginPanel />
          ) : (
            <form className="space-y-4" onSubmit={(event) => void handleLogin(event)}>
              <input
                type="email"
                autoComplete="email"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-violet-500/50 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                placeholder="Email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />

              <div className="space-y-2">
                <PasswordInput
                  placeholder="Password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 pr-11 text-sm text-white placeholder:text-zinc-500 focus:border-violet-500/50 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setForgotOpen(true)}
                    className="text-sm text-cyan-300 transition hover:text-cyan-200"
                  >
                    Forgot password?
                  </button>
                </div>
              </div>

              {error && (
                <p
                  role="alert"
                  className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Signing in…
                  </>
                ) : (
                  "Sign in"
                )}
              </button>

              <p className="text-center text-sm text-zinc-500">
                Need an account?{" "}
                <Link
                  href="/signup"
                  className="text-cyan-300 hover:text-cyan-200"
                >
                  Sign up
                </Link>
              </p>

              <p className="text-center text-sm text-zinc-500">
                Didn&apos;t get the verification email?{" "}
                <Link
                  href="/verify-email"
                  className="text-cyan-300 hover:text-cyan-200"
                >
                  Resend it
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>

      <ForgotPasswordModal
        open={forgotOpen}
        onClose={() => setForgotOpen(false)}
        initialEmail={email}
      />
    </>
  );
}

export default function LoginPage() {
  return (
    <AuthToastProvider>
      <div className="flex min-h-screen items-center justify-center bg-[#030014] px-4 py-8">
        <Suspense fallback={<div className="text-zinc-400">Loading…</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </AuthToastProvider>
  );
}
