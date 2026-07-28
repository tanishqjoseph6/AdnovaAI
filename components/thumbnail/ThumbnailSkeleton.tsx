"use client";

export default function ThumbnailSkeleton({ count = 3 }: { count?: number }) {
  return (
    <section
      className="space-y-4"
      aria-busy="true"
      aria-label="Generating thumbnails"
    >
      <div className="h-5 w-48 animate-pulse rounded bg-white/10" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
          >
            <div className="aspect-video animate-pulse bg-gradient-to-br from-white/10 via-violet-500/10 to-cyan-500/10" />
            <div className="space-y-3 p-4">
              <div className="h-4 w-3/4 animate-pulse rounded bg-white/10" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-white/10" />
              <div className="flex gap-2">
                <div className="h-8 w-24 animate-pulse rounded-lg bg-white/10" />
                <div className="h-8 w-24 animate-pulse rounded-lg bg-white/10" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
