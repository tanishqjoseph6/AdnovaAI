"use client";

export default function CalendarSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading calendar">
      <div className="h-28 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]" />
      <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
        <div className="h-[520px] animate-pulse rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.04] via-violet-500/10 to-cyan-500/10" />
        <div className="space-y-4">
          <div className="h-40 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]" />
          <div className="h-40 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]" />
          <div className="h-56 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]" />
        </div>
      </div>
    </div>
  );
}
