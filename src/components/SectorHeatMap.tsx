"use client";

import { Zap } from "lucide-react";
import {
  getSectorSentiment,
  type SectorSentiment,
} from "@/lib/mock-sec-service";
import { formatDollars } from "@/lib/format";

// Pre-compute Tailwind classes so they're not purged
const BUYING_TIERS: Record<number, { card: string; glow: string }> = {
  1: {
    card: "bg-emerald-500/10 border-emerald-500/30",
    glow: "shadow-[0_0_4px_rgba(16,185,129,0.15)]",
  },
  2: {
    card: "bg-emerald-500/15 border-emerald-500/40",
    glow: "shadow-[0_0_8px_rgba(16,185,129,0.25)]",
  },
  3: {
    card: "bg-emerald-500/20 border-emerald-500/50",
    glow: "shadow-[0_0_12px_rgba(16,185,129,0.35)]",
  },
  4: {
    card: "bg-emerald-500/25 border-emerald-500/60",
    glow: "shadow-[0_0_16px_rgba(16,185,129,0.45)]",
  },
  5: {
    card: "bg-emerald-500/30 border-emerald-500/70",
    glow: "shadow-[0_0_20px_rgba(16,185,129,0.55)]",
  },
};

const SELLING_TIERS: Record<number, { card: string; glow: string }> = {
  1: {
    card: "bg-rose-500/10 border-rose-500/30",
    glow: "shadow-[0_0_4px_rgba(244,63,94,0.15)]",
  },
  2: {
    card: "bg-rose-500/15 border-rose-500/40",
    glow: "shadow-[0_0_8px_rgba(244,63,94,0.25)]",
  },
  3: {
    card: "bg-rose-500/20 border-rose-500/50",
    glow: "shadow-[0_0_12px_rgba(244,63,94,0.35)]",
  },
  4: {
    card: "bg-rose-500/25 border-rose-500/60",
    glow: "shadow-[0_0_16px_rgba(244,63,94,0.45)]",
  },
  5: {
    card: "bg-rose-500/30 border-rose-500/70",
    glow: "shadow-[0_0_20px_rgba(244,63,94,0.55)]",
  },
};

function getTierStyles(s: SectorSentiment) {
  if (s.direction === "neutral" || s.glowLevel === 0) {
    return {
      card: "border-white/10 bg-slate-950/60",
      glow: "",
      label: "text-slate-400",
      flow: "text-slate-500",
    };
  }

  const tier = s.direction === "buying"
    ? BUYING_TIERS[s.glowLevel]
    : SELLING_TIERS[s.glowLevel];

  return {
    card: tier.card,
    glow: tier.glow,
    label: s.direction === "buying" ? "text-emerald-300" : "text-rose-300",
    flow: s.direction === "buying" ? "text-emerald-400" : "text-rose-400",
  };
}

const SECTOR_ICONS: Record<string, string> = {
  Tech: "\uD83D\uDCBB",
  "Auto & Energy": "\u26A1",
  "E-Commerce": "\uD83D\uDED2",
  Semiconductors: "\uD83E\uDDE0",
  Healthcare: "\uD83C\uDFE5",
  Finance: "\uD83C\uDFE6",
};

export default function SectorHeatMap() {
  const sectors = getSectorSentiment();

  return (
    <section className="mt-8">
      <div className="mb-4 flex items-center gap-2">
        <Zap className="h-4 w-4 text-amber-400" />
        <h3 className="text-sm font-medium uppercase tracking-wider text-slate-500">
          Market Sector Sentiment
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {sectors.map((s) => {
          const styles = getTierStyles(s);
          return (
            <div
              key={s.sector}
              className={`rounded-xl border p-4 transition-all backdrop-blur-md ${styles.card} ${styles.glow}`}
            >
              {/* Sector name + icon */}
              <div className="mb-2 flex items-center gap-2">
                <span className="text-lg">
                  {SECTOR_ICONS[s.sector] ?? "\uD83D\uDCCA"}
                </span>
                <h4 className={`text-sm font-semibold ${styles.label}`}>
                  {s.sector}
                </h4>
              </div>

              {/* Net flow */}
              <p className={`text-lg font-bold ${styles.flow}`}>
                {s.netFlow >= 0 ? "+" : ""}
                {formatDollars(s.netFlow)}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">
                net insider flow
              </p>

              {/* Buy / Sell counts */}
              <div className="mt-3 flex items-center gap-3 text-xs">
                <span className="text-emerald-400">
                  {s.buyCount} buy{s.buyCount !== 1 ? "s" : ""}
                </span>
                <span className="text-rose-400">
                  {s.sellCount} sell{s.sellCount !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Glow level indicator */}
              <div className="mt-2 flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full ${
                      i < s.glowLevel
                        ? s.direction === "buying"
                          ? "bg-emerald-400"
                          : s.direction === "selling"
                            ? "bg-rose-400"
                            : "bg-slate-700"
                        : "bg-slate-800"
                    }`}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
