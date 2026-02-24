"use client";

import { useState } from "react";
import {
  Search,
  TrendingUp,
  TrendingDown,
  Gauge,
  Activity,
  ShieldCheck,
  Globe,
  Star,
  Info,
} from "lucide-react";
import {
  getProcessedTrades,
  getGlobalTopTrades,
  getAvailableTickers,
  calculateConfidenceScore,
  getInsiderRating,
  type ProcessedTrade,
  type ConfidenceResult,
} from "@/lib/mock-sec-service";
import SectorHeatMap from "@/components/SectorHeatMap";

function formatDollars(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [tickerTrades, setTickerTrades] = useState<ProcessedTrade[]>([]);
  const [confidence, setConfidence] = useState<ConfidenceResult | null>(null);
  const [searched, setSearched] = useState(false);

  const activityFeed = tickerTrades.filter(
    (t) => t.transactionCode === "P" || t.transactionCode === "A",
  );

  const globalBuys = getGlobalTopTrades("P", 10);
  const globalSells = getGlobalTopTrades("S", 10);
  const availableTickers = getAvailableTickers();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setTickerTrades(getProcessedTrades(query));
    setConfidence(calculateConfidenceScore(query));
    setSearched(true);
  }

  function getScoreColor(score: number) {
    if (score <= 30) return { text: "text-rose-400", bg: "bg-rose-400", track: "bg-rose-500/20" };
    if (score <= 70) return { text: "text-amber-400", bg: "bg-amber-400", track: "bg-amber-500/20" };
    return { text: "text-emerald-400", bg: "bg-emerald-400", track: "bg-emerald-500/20" };
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="px-4 pt-10 pb-6 text-center">
        <div className="flex items-center justify-center gap-2">
          <ShieldCheck className="h-8 w-8 text-sky-400" />
          <h1 className="text-3xl font-bold tracking-tight text-slate-100 sm:text-4xl">
            Insider Edge
          </h1>
        </div>
        <p className="mt-2 text-sm text-slate-400 sm:text-base">
          Your simple guide to CEO buying and selling
        </p>
      </header>

      {/* ── TOP: Ticker Search ── */}
      <form onSubmit={handleSearch} className="mx-auto max-w-2xl px-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search any stock ticker (e.g. TSLA)"
            className="w-full rounded-xl border border-slate-800 bg-slate-900 py-4 pl-12 pr-4 text-base text-slate-100 placeholder-slate-500 outline-none transition-colors focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
          />
        </div>
        {!searched && (
          <p className="mt-3 text-center text-xs text-slate-500">
            Try: {availableTickers.join(", ")}
          </p>
        )}
      </form>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* ── MIDDLE ROW: Confidence Score + Ticker Activity Feed ── */}
        {searched && (
          <>
            {tickerTrades.length === 0 ? (
              <div className="mb-8 rounded-xl border border-slate-800 bg-slate-900 p-6 text-center">
                <p className="text-slate-400">
                  No insider trades found for{" "}
                  <span className="font-semibold text-slate-100">
                    {query.toUpperCase()}
                  </span>
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Try: {availableTickers.join(", ")}
                </p>
              </div>
            ) : (
              <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Confidence Score */}
                <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <Gauge className="h-5 w-5 text-sky-400" />
                    <h2 className="text-lg font-semibold text-slate-100">
                      Confidence Score
                    </h2>
                    <span className="ml-auto rounded bg-sky-500/10 px-2 py-0.5 text-xs font-medium text-sky-400">
                      {query.toUpperCase()}
                    </span>
                  </div>

                  {confidence && (
                    <>
                      {/* Circular Gauge */}
                      <div className="flex flex-col items-center py-4">
                        <div className="relative h-40 w-40">
                          <svg
                            viewBox="0 0 120 120"
                            className="h-full w-full -rotate-90"
                          >
                            {/* Track */}
                            <circle
                              cx="60"
                              cy="60"
                              r="52"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="10"
                              className="text-slate-800"
                            />
                            {/* Progress arc */}
                            <circle
                              cx="60"
                              cy="60"
                              r="52"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="10"
                              strokeLinecap="round"
                              strokeDasharray={`${(confidence.score / 100) * 327} 327`}
                              className={getScoreColor(confidence.score).text}
                            />
                          </svg>
                          {/* Score number overlay */}
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span
                              className={`text-4xl font-bold ${getScoreColor(confidence.score).text}`}
                            >
                              {confidence.score}
                            </span>
                            <span className="text-xs text-slate-400">
                              / 100
                            </span>
                          </div>
                        </div>
                        {/* Label */}
                        <span
                          className={`mt-3 rounded-full px-4 py-1 text-sm font-semibold ${getScoreColor(confidence.score).text} ${getScoreColor(confidence.score).track}`}
                        >
                          {confidence.label}
                        </span>
                      </div>

                      {/* Multi-segment bar */}
                      <div className="mt-4 mb-5">
                        <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
                          <div
                            className={`${getScoreColor(confidence.score).bg} transition-all duration-500`}
                            style={{ width: `${confidence.score}%` }}
                          />
                        </div>
                        <div className="mt-1.5 flex justify-between text-[10px] text-slate-500">
                          <span>0 — Caution</span>
                          <span>50 — Neutral</span>
                          <span>100 — High</span>
                        </div>
                      </div>

                      {/* Signal list — the "Why" */}
                      {confidence.signals.length > 0 && (
                        <div className="space-y-2 border-t border-slate-800 pt-4">
                          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                            Signals
                          </p>
                          {confidence.signals.map((signal) => (
                            <div
                              key={signal.text}
                              className="flex items-start gap-2 text-sm"
                            >
                              <span className="mt-0.5 shrink-0">
                                {signal.emoji}
                              </span>
                              <span className="text-slate-300">
                                {signal.text}
                              </span>
                              <span
                                className={`ml-auto shrink-0 text-xs font-semibold ${
                                  signal.points > 0
                                    ? "text-emerald-400"
                                    : "text-rose-400"
                                }`}
                              >
                                {signal.points > 0
                                  ? `+${signal.points}`
                                  : signal.points}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Ticker Activity Feed */}
                <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-sky-400" />
                    <h2 className="text-lg font-semibold text-slate-100">
                      Ticker Activity Feed
                    </h2>
                    <span className="ml-auto rounded bg-sky-500/10 px-2 py-0.5 text-xs font-medium text-sky-400">
                      {query.toUpperCase()}
                    </span>
                  </div>
                  <p className="mb-3 text-xs text-slate-400">
                    Recent personal purchases and company awards for this ticker
                  </p>
                  <div className="max-h-[400px] space-y-3 overflow-y-auto">
                    {activityFeed.length > 0 ? (
                      activityFeed.map((trade) => {
                        const rating = getInsiderRating(trade.insiderName);
                        return (
                          <div
                            key={`${trade.insiderName}-${trade.date}`}
                            className="rounded-lg border border-slate-800/50 bg-slate-950/50 p-4"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-slate-100">
                                    {trade.insiderName}
                                  </p>
                                  {/* Star Rating */}
                                  {rating && (
                                    <div className="group relative flex items-center gap-1">
                                      <div className="flex">
                                        {Array.from({ length: 5 }).map(
                                          (_, i) => (
                                            <Star
                                              key={i}
                                              className={`h-3.5 w-3.5 ${
                                                i < rating.stars
                                                  ? "fill-amber-400 text-amber-400"
                                                  : "text-slate-700"
                                              }`}
                                            />
                                          ),
                                        )}
                                      </div>
                                      {/* Info tooltip trigger */}
                                      <div className="relative">
                                        <Info className="h-3.5 w-3.5 cursor-help text-slate-600 transition-colors hover:text-slate-400" />
                                        <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-56 -translate-x-1/2 rounded-lg border border-slate-700 bg-slate-800 p-3 text-xs opacity-0 shadow-lg transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                                          <p className="mb-2 font-medium text-slate-200">
                                            Accuracy Rating ({rating.stars}/5)
                                          </p>
                                          <p className="mb-2 text-slate-400">
                                            Based on how the stock performed
                                            over 60 days following this
                                            person&apos;s last{" "}
                                            {rating.history.length} purchases.
                                          </p>
                                          <p className="text-slate-400">
                                            Avg 60-day return:{" "}
                                            <span
                                              className={
                                                rating.avgReturn >= 0
                                                  ? "font-semibold text-emerald-400"
                                                  : "font-semibold text-rose-400"
                                              }
                                            >
                                              {rating.avgReturn > 0 ? "+" : ""}
                                              {rating.avgReturn}%
                                            </span>
                                          </p>
                                          {/* Arrow */}
                                          <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <p className="text-xs text-slate-500">
                                  {trade.role}
                                </p>
                              </div>
                              <span className="text-xs text-slate-500">
                                {trade.date}
                              </span>
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span
                                className={`rounded px-2 py-0.5 text-xs font-medium ${
                                  trade.transactionCode === "P"
                                    ? "bg-emerald-500/10 text-emerald-400"
                                    : "bg-sky-500/10 text-sky-400"
                                }`}
                              >
                                {trade.transactionLabel}
                              </span>
                              <span className="text-xs text-slate-400">
                                {formatDollars(trade.tradeValue)}
                              </span>
                            </div>
                            <div className="mt-2 flex items-center gap-3 text-xs">
                              <span className="text-slate-400">
                                Skin in the Game:{" "}
                                <span
                                  className={
                                    trade.transactionCode === "P"
                                      ? "font-semibold text-emerald-400"
                                      : "font-semibold text-sky-400"
                                  }
                                >
                                  {trade.percentageChange}% of holdings
                                </span>
                              </span>
                              <span className="text-slate-400">
                                Score:{" "}
                                <span className="font-bold text-slate-100">
                                  {trade.convictionScore}
                                </span>
                              </span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="py-8 text-center text-sm text-slate-500">
                        No personal purchases or awards found
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── BOTTOM ROW: Market-Wide Global Leaderboards ── */}
        <div className="mb-2 flex items-center gap-2">
          <Globe className="h-4 w-4 text-slate-500" />
          <h3 className="text-sm font-medium uppercase tracking-wider text-slate-500">
            Market-Wide Leaderboards
          </h3>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Global Top Insider Buys */}
          <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-6">
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
              <h2 className="text-lg font-semibold text-slate-100">
                Top Insider Buys
              </h2>
              <span className="ml-auto rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
                All Tickers
              </span>
            </div>
            <p className="mb-3 text-xs text-slate-400">
              Biggest personal cash purchases across the entire market
            </p>
            <div className="max-h-[400px] overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-xs text-slate-400">
                    <th className="pb-2 font-medium">#</th>
                    <th className="pb-2 font-medium">Ticker</th>
                    <th className="pb-2 font-medium">Insider</th>
                    <th className="pb-2 text-right font-medium">Total $</th>
                  </tr>
                </thead>
                <tbody>
                  {globalBuys.map((trade, i) => (
                    <tr
                      key={`${trade.ticker}-${trade.insiderName}`}
                      className="border-b border-slate-800/50 last:border-0"
                    >
                      <td className="py-3 text-slate-500">{i + 1}</td>
                      <td className="py-3">
                        <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
                          {trade.ticker}
                        </span>
                      </td>
                      <td className="py-3 text-slate-300">
                        {trade.insiderName}
                      </td>
                      <td className="py-3 text-right font-medium text-emerald-400">
                        {formatDollars(trade.tradeValue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Global Top Insider Sells */}
          <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-6">
            <div className="mb-4 flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-rose-400" />
              <h2 className="text-lg font-semibold text-slate-100">
                Top Insider Sells
              </h2>
              <span className="ml-auto rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
                All Tickers
              </span>
            </div>
            <p className="mb-3 text-xs text-slate-400">
              Biggest insider sales across the entire market
            </p>
            <div className="max-h-[400px] overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-xs text-slate-400">
                    <th className="pb-2 font-medium">#</th>
                    <th className="pb-2 font-medium">Ticker</th>
                    <th className="pb-2 font-medium">Insider</th>
                    <th className="pb-2 text-right font-medium">Total $</th>
                  </tr>
                </thead>
                <tbody>
                  {globalSells.map((trade, i) => (
                    <tr
                      key={`${trade.ticker}-${trade.insiderName}`}
                      className="border-b border-slate-800/50 last:border-0"
                    >
                      <td className="py-3 text-slate-500">{i + 1}</td>
                      <td className="py-3">
                        <span className="rounded bg-rose-500/10 px-2 py-0.5 text-xs font-medium text-rose-400">
                          {trade.ticker}
                        </span>
                      </td>
                      <td className="py-3 text-slate-300">
                        {trade.insiderName}
                      </td>
                      <td className="py-3 text-right font-medium text-rose-400">
                        {formatDollars(trade.tradeValue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── SECTOR HEAT MAP ── */}
        <SectorHeatMap />
      </main>

      {/* Footer */}
      <footer className="px-4 py-8 text-center">
        <p className="text-xs text-slate-500">
          Data sourced from SEC filings. Analysis powered by AI.
        </p>
      </footer>
    </div>
  );
}
