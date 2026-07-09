"use client";

import Link from "next/link";
import { useCredits } from "@/hooks/useCredits";

export default function CreditBadge() {
  const { credits, isLoading } = useCredits();

  if (isLoading && !credits) {
    return (
      <span className="inline-flex h-9 w-9 shrink-0 animate-pulse rounded-xl border border-white/10 bg-white/[0.03] sm:h-10 sm:w-auto sm:px-3" />
    );
  }

  if (!credits) {
    return null;
  }

  const label = `${credits.credits} left`;
  const compactLabel = String(credits.credits);

  return (
    <Link
      href="/dashboard/billing"
      className="inline-flex shrink-0 items-center justify-center gap-1 rounded-xl border border-white/10 bg-white/[0.03] px-2 py-2 text-xs font-medium text-zinc-300 transition hover:bg-white/[0.06] sm:gap-1.5 sm:px-3"
      title="View billing & credits"
      aria-label={`${label}. View billing and credits`}
    >
      <svg
        className="h-4 w-4 shrink-0 text-cyan-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375"
        />
      </svg>
      <span className="sm:hidden">{compactLabel}</span>
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );
}
