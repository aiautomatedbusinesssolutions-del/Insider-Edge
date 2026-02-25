"use client";

import { useState, useMemo } from "react";
import {
  getProcessedTrades,
  calculateConfidenceScore,
  type ProcessedTrade,
  type ConfidenceResult,
} from "@/lib/mock-sec-service";

export function useTickerSearch() {
  const [query, setQuery] = useState("");
  const [tickerTrades, setTickerTrades] = useState<ProcessedTrade[]>([]);
  const [confidence, setConfidence] = useState<ConfidenceResult | null>(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [extendedSearch, setExtendedSearch] = useState(false);
  const [loadingExtended, setLoadingExtended] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activityFeed = useMemo(
    () =>
      tickerTrades.filter(
        (t) => t.transactionCode === "P" || t.transactionCode === "A",
      ),
    [tickerTrades],
  );

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    setExtendedSearch(false);
    setErrorMessage(null);

    // Ensure skeleton is visible for at least 400ms
    setTimeout(() => {
      setTickerTrades(getProcessedTrades(query));
      setConfidence(calculateConfidenceScore(query));
      setLoading(false);
    }, 400);
  }

  async function handleCheckOlder() {
    if (!query.trim() || loadingExtended) return;
    setLoadingExtended(true);
    setErrorMessage(null);
    try {
      const res = await fetch(
        `/api/insider-trades?ticker=${encodeURIComponent(query)}&extended=true`,
      );
      if (res.ok) {
        const data = await res.json();
        if (data.trades && data.trades.length > 0) {
          setTickerTrades(data.trades);
          setConfidence(data.confidence);
          setExtendedSearch(true);
        } else {
          setExtendedSearch(true);
        }
      } else {
        setErrorMessage("Failed to fetch older filings. Please try again.");
      }
    } catch {
      setErrorMessage("Network error — could not reach the server.");
    } finally {
      setLoadingExtended(false);
    }
  }

  return {
    query,
    setQuery,
    tickerTrades,
    confidence,
    searched,
    loading,
    extendedSearch,
    loadingExtended,
    errorMessage,
    activityFeed,
    handleSearch,
    handleCheckOlder,
  };
}
