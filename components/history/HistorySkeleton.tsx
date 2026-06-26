export default function HistorySkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading generation history">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="h-10 w-full max-w-md animate-pulse rounded-xl bg-white/[0.06]" />
        <div className="flex gap-2">
          <div className="h-10 w-24 animate-pulse rounded-xl bg-white/[0.06]" />
          <div className="h-10 w-32 animate-pulse rounded-xl bg-white/[0.06]" />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-9 w-20 animate-pulse rounded-full bg-white/[0.06]"
          />
        ))}
      </div>

      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="glass animate-pulse rounded-2xl border border-white/[0.06] p-6"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="h-5 w-48 rounded-lg bg-white/[0.08]" />
              <div className="h-4 w-32 rounded-lg bg-white/[0.05]" />
            </div>
            <div className="flex gap-2">
              <div className="h-6 w-14 rounded-full bg-white/[0.06]" />
              <div className="h-6 w-20 rounded-full bg-white/[0.06]" />
            </div>
          </div>
          <div className="mt-6 space-y-3">
            <div className="h-12 rounded-xl bg-white/[0.05]" />
            <div className="h-12 rounded-xl bg-white/[0.05]" />
            <div className="h-24 rounded-xl bg-white/[0.05]" />
          </div>
        </div>
      ))}
    </div>
  );
}
