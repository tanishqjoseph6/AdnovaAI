"use client";

import { useCredits } from "@/hooks/useCredits";
import StatCard from "@/components/dashboard/StatCard";

export default function CreditsStatCard() {
  const { credits, isLoading } = useCredits();

  const value = isLoading
    ? "—"
    : credits?.unlimited
      ? "∞"
      : String(credits?.credits ?? 0);

  const change = credits?.unlimited
    ? "Pro"
    : credits
      ? `${credits.maxCredits ?? 5} max`
      : "";

  return (
    <StatCard
      label="Credits remaining"
      value={value}
      change={change}
      positive={credits ? credits.unlimited || credits.credits > 0 : true}
      accent="emerald"
      icon={
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375"
          />
        </svg>
      }
    />
  );
}
