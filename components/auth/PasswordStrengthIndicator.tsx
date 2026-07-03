"use client";

import { scorePasswordStrength } from "@/lib/auth/password-strength";

type PasswordStrengthIndicatorProps = {
  password: string;
};

export default function PasswordStrengthIndicator({
  password,
}: PasswordStrengthIndicatorProps) {
  const strength = scorePasswordStrength(password);

  if (strength.level === "empty") {
    return null;
  }

  return (
    <div className="space-y-2" aria-live="polite">
      <div className="flex items-center justify-between text-xs">
        <span className="text-zinc-500">Password strength</span>
        <span
          className={
            strength.level === "weak"
              ? "text-red-400"
              : strength.level === "fair"
                ? "text-amber-400"
                : strength.level === "good"
                  ? "text-cyan-400"
                  : "text-emerald-400"
          }
        >
          {strength.label}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full transition-all duration-300 ${strength.colorClass}`}
          style={{ width: `${strength.percent}%` }}
          role="progressbar"
          aria-valuenow={strength.percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Password strength: ${strength.label}`}
        />
      </div>
    </div>
  );
}
