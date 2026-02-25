import { NextRequest, NextResponse } from "next/server";
import {
  getTickerDetails,
  getInsiderFilings,
  getLatestPrice,
  getParsedInsiderTrades,
  type ParsedForm4Trade,
} from "@/lib/polygon";
import {
  getProcessedTrades,
  calculateConfidenceScore,
  calculateConfidenceFromTrades,
  scoreConviction,
  TRANSACTION_LABELS,
  type ProcessedTrade,
  type ConfidenceResult,
} from "@/lib/mock-sec-service";

// ---------------------------------------------------------------------------
// GET /api/insider-trades?ticker=TSLA&extended=true
//
// Standard (30 days): Polygon metadata + mock service parsed trades
// Extended (6 months): Fetches & parses actual Form 4 XML from SEC EDGAR
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// In-memory response cache (5-minute TTL)
// ---------------------------------------------------------------------------

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const responseCache = new Map<
  string,
  { data: Record<string, unknown>; timestamp: number }
>();

/** Convert parsed Form 4 data into our app's ProcessedTrade format */
function convertToProcessedTrades(
  parsed: ParsedForm4Trade[],
  sector: string,
): ProcessedTrade[] {
  return parsed.map((t) => {
    const tradeValue = t.sharesTraded * t.sharePrice;
    const holdingsBefore =
      t.transactionCode.toUpperCase() === "P" || t.transactionCode.toUpperCase() === "A"
        ? Math.max(0, t.sharesOwnedAfter - t.sharesTraded)
        : t.sharesOwnedAfter + t.sharesTraded;

    const percentageChange =
      holdingsBefore > 0 ? (t.sharesTraded / holdingsBefore) * 100 : 0;

    const code = t.transactionCode.toUpperCase();

    return {
      ticker: t.ticker,
      sector: sector as ProcessedTrade["sector"],
      insiderName: t.insiderName,
      role: t.role,
      transactionCode: (code === "P" || code === "S" || code === "A"
        ? code
        : "A") as ProcessedTrade["transactionCode"],
      sharesTraded: t.sharesTraded,
      sharePrice: t.sharePrice,
      totalHoldingsBefore: holdingsBefore,
      date: t.filingDate,
      transactionLabel: TRANSACTION_LABELS[code] ?? `Transaction (${code})`,
      tradeValue,
      percentageChange: Math.round(percentageChange * 100) / 100,
      convictionScore: scoreConviction(code, percentageChange),
    };
  });
}

export async function GET(request: NextRequest) {
  const ticker = request.nextUrl.searchParams.get("ticker");
  const extended = request.nextUrl.searchParams.get("extended") === "true";

  if (!ticker) {
    return NextResponse.json(
      { error: "Missing ?ticker= parameter" },
      { status: 400 },
    );
  }

  const normalised = ticker.trim().toUpperCase();
  const cacheKey = `${normalised}:${extended}`;

  // Check cache
  const cached = responseCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  const lookbackDays = extended ? 180 : 30;

  // Run Polygon calls in parallel — each is independent
  const [detailsResult, filingsResult, priceResult] = await Promise.allSettled([
    getTickerDetails(normalised),
    extended
      ? getParsedInsiderTrades(normalised, 180, 10)
      : getInsiderFilings(normalised, 20, lookbackDays),
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

  // Latest price from Polygon
  const price =
    priceResult.status === "fulfilled" ? priceResult.value : null;

  let trades: ProcessedTrade[];
  let confidence: ConfidenceResult;
  let filingCount = 0;

  if (extended && filingsResult.status === "fulfilled") {
    // Extended mode: we got parsed Form 4 trades from SEC EDGAR
    const parsedTrades = filingsResult.value as ParsedForm4Trade[];
    trades = convertToProcessedTrades(parsedTrades, company.sector)
      .sort((a, b) => b.date.localeCompare(a.date));
    confidence = trades.length > 0
      ? calculateConfidenceFromTrades(trades)
      : { score: 50, label: "Neutral", signals: [] };
    filingCount = parsedTrades.length;
  } else {
    // Standard mode: mock service + filing metadata
    const filingData =
      !extended && filingsResult.status === "fulfilled"
        ? (filingsResult.value as { filings: unknown[]; totalCount: number })
        : { filings: [], totalCount: 0 };
    filingCount = filingData.totalCount;
    trades = getProcessedTrades(normalised);
    confidence = calculateConfidenceScore(normalised);
  }

  const responseData = {
    ticker: normalised,
    lookbackDays,
    company: {
      name: company.name,
      sector: company.sector,
      marketCap: company.marketCap,
      description: company.description,
    },
    price: price
      ? { close: price.close, volume: price.volume, date: price.date }
      : null,
    filings: { recentForm4Count: filingCount },
    trades,
    confidence,
    _meta: {
      source: extended
        ? "polygon.io + sec-edgar-parsed"
        : "polygon.io + mock-sec-service",
    },
  };

  // Store in cache
  responseCache.set(cacheKey, { data: responseData, timestamp: Date.now() });

  return NextResponse.json(responseData);
}
