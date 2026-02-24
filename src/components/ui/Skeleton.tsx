"use client";

export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/60 backdrop-blur-md p-6">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <div className="h-5 w-5 rounded skeleton-shimmer" />
        <div className="h-5 w-32 rounded skeleton-shimmer" />
        <div className="ml-auto h-5 w-14 rounded skeleton-shimmer" />
      </div>

      {/* Gauge circle placeholder */}
      <div className="flex flex-col items-center py-4">
        <div className="h-40 w-40 rounded-full skeleton-shimmer" />
        <div className="mt-3 h-7 w-24 rounded-full skeleton-shimmer" />
      </div>

      {/* Progress bar */}
      <div className="mt-4 mb-5">
        <div className="h-2.5 w-full rounded-full skeleton-shimmer" />
        <div className="mt-1.5 flex justify-between">
          <div className="h-3 w-16 rounded skeleton-shimmer" />
          <div className="h-3 w-16 rounded skeleton-shimmer" />
          <div className="h-3 w-16 rounded skeleton-shimmer" />
        </div>
      </div>

      {/* Signal lines */}
      <div className="space-y-2 border-t border-white/10 pt-4">
        <div className="h-3 w-16 rounded skeleton-shimmer" />
        <div className="h-4 w-full rounded skeleton-shimmer" />
        <div className="h-4 w-3/4 rounded skeleton-shimmer" />
      </div>
    </div>
  );
}

export function SkeletonFeed() {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/60 backdrop-blur-md p-6">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <div className="h-5 w-5 rounded skeleton-shimmer" />
        <div className="h-5 w-40 rounded skeleton-shimmer" />
        <div className="ml-auto h-5 w-14 rounded skeleton-shimmer" />
      </div>

      <div className="mb-3 h-3.5 w-64 rounded skeleton-shimmer" />

      {/* Trade row placeholders */}
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-lg border border-white/5 bg-slate-950/60 p-4"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="h-4 w-36 rounded skeleton-shimmer" />
                <div className="h-3 w-24 rounded skeleton-shimmer" />
              </div>
              <div className="h-3 w-20 rounded skeleton-shimmer" />
            </div>
            <div className="mt-2 flex gap-2">
              <div className="h-5 w-28 rounded skeleton-shimmer" />
              <div className="h-5 w-16 rounded skeleton-shimmer" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
