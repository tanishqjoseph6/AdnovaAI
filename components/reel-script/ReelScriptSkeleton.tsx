"use client";

export default function ReelScriptSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Generating reel script">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="glass animate-pulse rounded-2xl border border-white/[0.08] p-5 sm:p-6"
        >
          <div className="h-4 w-32 rounded bg-white/10" />
          <div className="mt-4 space-y-2">
            <div className="h-3 w-full rounded bg-white/[0.06]" />
            <div className="h-3 w-5/6 rounded bg-white/[0.06]" />
            <div className="h-3 w-2/3 rounded bg-white/[0.06]" />
          </div>
        </div>
      ))}
    </div>
  );
}
