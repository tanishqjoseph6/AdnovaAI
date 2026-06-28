"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Loader2 } from "lucide-react";
import PasswordInput from "@/components/auth/PasswordInput";
import { mapAuthErrorMessage } from "@/lib/auth/errors";
import { isEmailVerified } from "@/lib/auth/email-verified";
import { isValidEmail, normalizeEmail } from "@/lib/auth/validation";
import { supabase } from "@/lib/supabase";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    searchParams.get("error") ? mapAuthErrorMessage(searchParams.get("error")!) : null
  );
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogin() {
    setError(null);

    const normalized = normalizeEmail(email);
    if (!isValidEmail(normalized)) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: normalized,
        password,
      });

      if (signInError) {
        setError(mapAuthErrorMessage(signInError.message));
        return;
      }

      if (data.user && !isEmailVerified(data.user)) {
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
    <div className="glass w-full max-w-md rounded-2xl border border-white/10 p-8 shadow-xl shadow-violet-500/10">
      <h1 className="text-3xl font-bold text-white">Welcome back</h1>
      <p className="mt-2 text-sm text-zinc-400">Sign in to your Advora AI account.</p>

      <div className="mt-8 space-y-4">
        <input
          type="email"
          autoComplete="email"
          className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-violet-500/50 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <PasswordInput
          placeholder="Password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        {error && (
          <p role="alert" className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={() => void handleLogin()}
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
          <Link href="/signup" className="text-cyan-300 hover:text-cyan-200">
            Sign up
          </Link>
        </p>

        <p className="text-center text-sm text-zinc-500">
          Didn&apos;t get the verification email?{" "}
          <Link href="/verify-email" className="text-cyan-300 hover:text-cyan-200">
            Resend it
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#030014] px-4">
      <Suspense fallback={<div className="text-zinc-400">Loading…</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
