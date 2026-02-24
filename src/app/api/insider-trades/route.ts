import { NextRequest, NextResponse } from "next/server";
import {
  getTickerDetails,
  getInsiderFilings,
  getLatestPrice,
} from "@/lib/polygon";
import {
  getProcessedTrades,
  calculateConfidenceScore,
} from "@/lib/mock-sec-service";

// ---------------------------------------------------------------------------
// GET /api/insider-trades?ticker=TSLA
//
// Combines:
//   - Polygon.io  → company details, sector, filing count, stock price
//   - Mock service → parsed insider trade data, confidence score
//
// Once a dedicated parsed-insider API is added, the mock data layer can
// be swapped out without changing this route's response shape.
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const ticker = request.nextUrl.searchParams.get("ticker");

  if (!ticker) {
    return NextResponse.json(
      { error: "Missing ?ticker= parameter" },
      { status: 400 },
    );
  }

  const normalised = ticker.trim().toUpperCase();

  // Run Polygon calls in parallel — each is independent
  const [detailsResult, filingsResult, priceResult] = await Promise.allSettled([
    getTickerDetails(normalised),
    getInsiderFilings(normalised),
    getLatestPrice(normalised),
  ]);

  // Company details from Polygon (or fallback)
  const company =
    detailsResult.status === "fulfilled"
      ? detailsResult.value
      : {
          ticker: normalised,
          name: normalised,
          description: "",
          sector: "Unknown",
          industry: "Unknown",
          marketCap: 0,
          homepageUrl: "",
          iconUrl: "",
          listDate: "",
          totalEmployees: 0,
        };

  // Filing metadata from Polygon
  const filingData =
    filingsResult.status === "fulfilled"
      ? filingsResult.value
      : { filings: [], totalCount: 0 };

  // Latest price from Polygon
  const price =
    priceResult.status === "fulfilled" ? priceResult.value : null;

  // Parsed insider trades from mock service (structured data)
  const trades = getProcessedTrades(normalised);
  const confidence = calculateConfidenceScore(normalised);

  return NextResponse.json({
    ticker: normalised,
    company: {
      name: company.name,
      sector: company.sector,
      marketCap: company.marketCap,
      description: company.description,
    },
    price: price
      ? {
          close: price.close,
          volume: price.volume,
          date: price.date,
        }
      : null,
    filings: {
      recentForm4Count: filingData.totalCount,
      entries: filingData.filings,
    },
    trades,
    confidence,
    _meta: {
      source: "polygon.io + mock-sec-service",
      note: "Parsed insider trade fields use mock data. Polygon provides company details, filing metadata, and stock price.",
    },
  });
}
