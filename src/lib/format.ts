// ---------------------------------------------------------------------------
// Shared formatting utilities
// ---------------------------------------------------------------------------

export function formatDollars(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

export function getScoreColor(score: number) {
  if (score <= 30)
    return { text: "text-rose-400", bg: "bg-rose-400", track: "bg-rose-500/20" };
  if (score <= 70)
    return { text: "text-amber-400", bg: "bg-amber-400", track: "bg-amber-500/20" };
  return { text: "text-emerald-400", bg: "bg-emerald-400", track: "bg-emerald-500/20" };
}
