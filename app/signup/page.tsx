"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import PasswordInput from "@/components/auth/PasswordInput";
import { mapAuthErrorMessage, DUPLICATE_EMAIL_MESSAGE } from "@/lib/auth/errors";
import { useAuthPageGuard } from "@/lib/auth/use-auth-page-guard";
import { isValidEmail, normalizeEmail } from "@/lib/auth/validation";

export default function SignupPage() {
  const router = useRouter();
  useAuthPageGuard();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [referralCode, setReferralCode] = useState("");

  useEffect(() => {
    setReferralCode(new URLSearchParams(window.location.search).get("ref") ?? "");
  }, []);

  async function handleSignup(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    const normalized = normalizeEmail(email);
    if (!isValidEmail(normalized)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setIsLoading(true);

    try {
      const checkResponse = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalized }),
      });

      const checkPayload = (await checkResponse.json()) as {
        available?: boolean;
        message?: string | null;
      };

      if (!checkResponse.ok || checkPayload.available === false) {
        setError(
          mapAuthErrorMessage(
            checkPayload.message ?? DUPLICATE_EMAIL_MESSAGE
          )
        );
        return;
      }

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalized,
          password,
          referralCode: referralCode || undefined,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        setError(mapAuthErrorMessage(payload.error ?? "Signup failed."));
        return;
      }

      setMessage(
        payload.message ??
          "Check your email to confirm your account before signing in."
      );

      setTimeout(() => {
        router.push(
          `/verify-email?email=${encodeURIComponent(normalized)}`
        );
      }, 2000);
    } catch {
      setError("Unable to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#030014] px-4 py-8">
      <div className="glass w-full max-w-md rounded-2xl border border-white/10 p-6 shadow-xl shadow-violet-500/10 sm:p-8">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">
          Create account
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Start with Advora AI. We&apos;ll email you a verification link.
        </p>
        {referralCode && (
          <p className="mt-3 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-sm text-cyan-200">
            Referral applied: {referralCode}
          </p>
        )}

        <form className="mt-8 space-y-4" onSubmit={(event) => void handleSignup(event)}>
          <input
            type="email"
            autoComplete="email"
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-violet-500/50 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

          <PasswordInput
            placeholder="Password (min. 8 characters)"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
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
            disabled={isLoading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Creating account…
              </>
            ) : (
              "Sign up"
            )}
          </button>

          <p className="text-center text-sm text-zinc-500">
            Already have an account?{" "}
            <Link href="/login" className="text-cyan-300 hover:text-cyan-200">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
