"use client";

export default function CompetitorAnalyzerSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="glass rounded-2xl border border-white/[0.08] p-6 sm:p-8">
        <div className="mx-auto h-28 max-w-xs rounded-full bg-white/10" />
        <div className="mx-auto mt-4 h-4 w-40 rounded bg-white/10" />
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="h-16 rounded-xl bg-white/[0.06]" />
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="glass h-48 rounded-2xl border border-white/[0.08] p-6"
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
    </div>
  );
}
