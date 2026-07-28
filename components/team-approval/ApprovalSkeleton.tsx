"use client";

export default function ApprovalSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading team approvals">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-24 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]"
          />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <div className="h-[520px] animate-pulse rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.04] via-violet-500/10 to-cyan-500/10" />
        <div className="space-y-4">
          <div className="h-48 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]" />
          <div className="h-64 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]" />
        </div>
      </div>
    </div>
  );
}
