export default function DashboardSkeleton() {
  return (
    <div className="space-y-10" aria-busy="true" aria-label="Loading dashboard">
      <div className="space-y-4">
        <div className="h-10 w-72 max-w-full animate-pulse rounded-lg bg-white/[0.06]" />
        <div className="h-5 w-96 max-w-full animate-pulse rounded-lg bg-white/[0.04]" />
        <div className="h-40 animate-pulse rounded-2xl bg-white/[0.04]" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-36 animate-pulse rounded-2xl bg-white/[0.04]"
          />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-2xl bg-white/[0.04]"
          />
        ))}
      </div>
    </div>
  );
}
