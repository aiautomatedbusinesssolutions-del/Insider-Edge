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
  type ProcessedTrade,
  type ConfidenceResult,
} from "@/lib/mock-sec-service";

// ---------------------------------------------------------------------------
// GET /api/insider-trades?ticker=TSLA&extended=true
//
// Standard (30 days): Polygon metadata + mock service parsed trades
// Extended (6 months): Fetches & parses actual Form 4 XML from SEC EDGAR
// ---------------------------------------------------------------------------

/** Map SEC transaction codes to our beginner-friendly labels */
function getTransactionLabel(code: string): string {
  switch (code.toUpperCase()) {
    case "P": return "Used Personal Cash";
    case "S": return "Insider Selling";
    case "A": return "Company Award";
    case "M": return "Option Exercise";
    case "G": return "Gift";
    case "F": return "Tax Withholding";
    default:  return `Transaction (${code})`;
  }
}

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

    let convictionScore: number;
    const code = t.transactionCode.toUpperCase();
    if (code === "P") {
      if (percentageChange >= 50) convictionScore = 98;
      else if (percentageChange >= 25) convictionScore = 92;
      else if (percentageChange >= 10) convictionScore = 85;
      else if (percentageChange >= 5) convictionScore = 72;
      else convictionScore = Math.max(40, Math.round(percentageChange * 8));
    } else if (code === "S") {
      if (percentageChange >= 50) convictionScore = 70;
      else if (percentageChange >= 20) convictionScore = 55;
      else convictionScore = Math.max(20, Math.round(percentageChange * 2.5));
    } else {
      convictionScore = Math.min(30, Math.round(10 + percentageChange * 0.5));
    }

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
      transactionLabel: getTransactionLabel(t.transactionCode),
      tradeValue,
      percentageChange: Math.round(percentageChange * 100) / 100,
      convictionScore,
    };
  });
}

/** Build a confidence score from live parsed trades */
function buildLiveConfidence(trades: ProcessedTrade[]): ConfidenceResult {
  let score = 50;
  const signals: ConfidenceResult["signals"] = [];

  const buys = trades.filter((t) => t.transactionCode === "P");
  const uniqueBuyers = new Set(buys.map((t) => t.insiderName));

  if (uniqueBuyers.size >= 3) {
    score += 30;
    signals.push({
      emoji: "\uD83D\uDD25",
      text: `Cluster Buy (${uniqueBuyers.size} Insiders)`,
      points: 30,
    });
  }

  const execBuyers = buys.filter(
    (t) =>
      t.role.toUpperCase().includes("CEO") ||
      t.role.toUpperCase().includes("CFO") ||
      t.role.toUpperCase().includes("CHIEF"),
  );
  if (execBuyers.length > 0) {
    score += 20;
    signals.push({
      emoji: "\u2705",
      text: `${execBuyers[0].insiderName} (${execBuyers[0].role}) Buying Detected`,
      points: 20,
    });
  }

  const bigBuys = buys.filter((t) => t.percentageChange > 10);
  if (bigBuys.length > 0) {
    score += 15;
    const biggest = bigBuys.reduce((a, b) =>
      a.percentageChange > b.percentageChange ? a : b,
    );
    signals.push({
      emoji: "\uD83D\uDCAA",
      text: `${biggest.insiderName} increased stake by ${Math.round(biggest.percentageChange)}%`,
      points: 15,
    });
  }

  const sells = trades.filter((t) => t.transactionCode === "S");
  if (sells.length > 0) {
    const penalty = sells.length * 20;
    score -= penalty;
    signals.push({
      emoji: "\u26A0\uFE0F",
      text: `${sells.length} Insider Sale${sells.length > 1 ? "s" : ""} Detected`,
      points: -penalty,
    });
  }

  score = Math.max(0, Math.min(100, score));

  let label: ConfidenceResult["label"];
  if (score <= 30) label = "Caution";
  else if (score <= 70) label = "Neutral";
  else label = "High Confidence";

  return { score, label, signals };
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
      ? buildLiveConfidence(trades)
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

  return NextResponse.json({
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
  });
}
