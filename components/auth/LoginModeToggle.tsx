"use client";

import { motion } from "framer-motion";

export type LoginMode = "password" | "otp";

type LoginModeToggleProps = {
  mode: LoginMode;
  onChange: (mode: LoginMode) => void;
};

export default function LoginModeToggle({
  mode,
  onChange,
}: LoginModeToggleProps) {
  return (
    <div
      className="inline-flex w-full rounded-2xl border border-white/10 bg-white/[0.04] p-1"
      role="tablist"
      aria-label="Sign in method"
    >
      {(
        [
          { id: "password" as const, label: "Password" },
          { id: "otp" as const, label: "Email OTP" },
        ] as const
      ).map((option) => {
        const active = mode === option.id;
        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.id)}
            className={`relative flex-1 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              active ? "text-white" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {active && (
              <motion.span
                layoutId="login-mode-toggle"
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/20 via-violet-500/20 to-fuchsia-500/20 ring-1 ring-white/10"
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
              />
            )}
            <span className="relative">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
