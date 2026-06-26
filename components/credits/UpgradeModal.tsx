"use client";

import Link from "next/link";
import { useEffect } from "react";

type UpgradeModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function UpgradeModal({ open, onClose }: UpgradeModalProps) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-[#030014]/80 backdrop-blur-sm"
        aria-label="Close upgrade modal"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#0a0520] p-6 shadow-2xl shadow-violet-500/10 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-10 h-36 w-36 rounded-full bg-cyan-500/15 blur-3xl" />

        <div className="relative">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-2xl shadow-lg shadow-violet-500/30">
            👑
          </div>

          <h2
            id="upgrade-modal-title"
            className="mt-5 text-center text-2xl font-bold text-white"
          >
            You&apos;re out of credits
          </h2>
          <p className="mt-3 text-center text-sm leading-relaxed text-zinc-400">
            Free plans include 5 AI generations. Upgrade to{" "}
            <span className="font-medium text-violet-300">Pro</span> for unlimited
            ad hooks, captions, CTAs, and UGC scripts.
          </p>

          <ul className="mt-6 space-y-2 text-sm text-zinc-300">
            {[
              "Unlimited AI generations",
              "Priority support",
              "No credit limits ever",
            ].map((feature) => (
              <li key={feature} className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
                  ✓
                </span>
                {feature}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/dashboard/billing"
              onClick={onClose}
              className="inline-flex flex-1 items-center justify-center rounded-xl bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:opacity-90"
            >
              Upgrade to Pro
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex flex-1 items-center justify-center rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-zinc-300 transition hover:bg-white/5"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
