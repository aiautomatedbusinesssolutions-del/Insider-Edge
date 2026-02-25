// ---------------------------------------------------------------------------
// Mock SEC Service — Data structure, mock DB, and transformation logic
// ---------------------------------------------------------------------------

export type TransactionCode = "P" | "S" | "A";

export type Sector =
  | "Tech"
  | "Auto & Energy"
  | "E-Commerce"
  | "Semiconductors"
  | "Healthcare"
  | "Finance";

export interface InsiderTrade {
  ticker: string;
  sector: Sector;
  insiderName: string;
  role: string;
  transactionCode: TransactionCode;
  sharesTraded: number;
  sharePrice: number;
  totalHoldingsBefore: number;
  date: string;
}

export interface ProcessedTrade extends InsiderTrade {
  /** Beginner-friendly label */
  transactionLabel: string;
  /** Total dollar value of the trade */
  tradeValue: number;
  /** % change relative to holdings before the trade */
  percentageChange: number;
  /** 0-100 conviction score */
  convictionScore: number;
}

// ---------------------------------------------------------------------------
// Mock Database
// ---------------------------------------------------------------------------

const MOCK_TRADES: InsiderTrade[] = [
  // ---- TSLA (Auto & Energy) ----
  {
    ticker: "TSLA",
    sector: "Auto & Energy",
    insiderName: "Elon Musk",
    role: "CEO",
    transactionCode: "P",
    sharesTraded: 500_000,
    sharePrice: 178.5,
    totalHoldingsBefore: 1_000_000,
    date: "2026-02-22",
  },
  {
    ticker: "TSLA",
    sector: "Auto & Energy",
    insiderName: "Robyn Denholm",
    role: "Chair of the Board",
    transactionCode: "A",
    sharesTraded: 25_000,
    sharePrice: 180.0,
    totalHoldingsBefore: 200_000,
    date: "2026-02-21",
  },
  {
    ticker: "TSLA",
    sector: "Auto & Energy",
    insiderName: "Zachary Kirkhorn",
    role: "CFO",
    transactionCode: "S",
    sharesTraded: 12_000,
    sharePrice: 182.3,
    totalHoldingsBefore: 95_000,
    date: "2026-02-20",
  },
  {
    ticker: "TSLA",
    sector: "Auto & Energy",
    insiderName: "Andrew Baglino",
    role: "SVP, Powertrain & Energy",
    transactionCode: "P",
    sharesTraded: 8_000,
    sharePrice: 175.0,
    totalHoldingsBefore: 120_000,
    date: "2026-02-19",
  },
  {
    ticker: "TSLA",
    sector: "Auto & Energy",
    insiderName: "Vaibhav Taneja",
    role: "CFO",
    transactionCode: "S",
    sharesTraded: 3_000,
    sharePrice: 179.0,
    totalHoldingsBefore: 45_000,
    date: "2026-02-18",
  },

  // ---- AAPL (Tech) ----
  {
    ticker: "AAPL",
    sector: "Tech",
    insiderName: "Tim Cook",
    role: "CEO",
    transactionCode: "S",
    sharesTraded: 200_000,
    sharePrice: 231.45,
    totalHoldingsBefore: 3_280_000,
    date: "2026-02-22",
  },
  {
    ticker: "AAPL",
    sector: "Tech",
    insiderName: "Luca Maestri",
    role: "SVP & CFO",
    transactionCode: "P",
    sharesTraded: 15_000,
    sharePrice: 228.1,
    totalHoldingsBefore: 110_000,
    date: "2026-02-21",
  },
  {
    ticker: "AAPL",
    sector: "Tech",
    insiderName: "Jeff Williams",
    role: "COO",
    transactionCode: "A",
    sharesTraded: 40_000,
    sharePrice: 229.75,
    totalHoldingsBefore: 490_000,
    date: "2026-02-20",
  },
  {
    ticker: "AAPL",
    sector: "Tech",
    insiderName: "Deirdre O'Brien",
    role: "SVP, Retail",
    transactionCode: "P",
    sharesTraded: 60_000,
    sharePrice: 227.0,
    totalHoldingsBefore: 120_000,
    date: "2026-02-19",
  },

  // ---- AMZN (E-Commerce) ----
  {
    ticker: "AMZN",
    sector: "E-Commerce",
    insiderName: "Andy Jassy",
    role: "CEO",
    transactionCode: "P",
    sharesTraded: 30_000,
    sharePrice: 186.22,
    totalHoldingsBefore: 850_000,
    date: "2026-02-22",
  },
  {
    ticker: "AMZN",
    sector: "E-Commerce",
    insiderName: "Brian Olsavsky",
    role: "SVP & CFO",
    transactionCode: "S",
    sharesTraded: 45_000,
    sharePrice: 188.0,
    totalHoldingsBefore: 320_000,
    date: "2026-02-21",
  },
  {
    ticker: "AMZN",
    sector: "E-Commerce",
    insiderName: "Adam Selipsky",
    role: "CEO, AWS",
    transactionCode: "P",
    sharesTraded: 10_000,
    sharePrice: 185.5,
    totalHoldingsBefore: 75_000,
    date: "2026-02-20",
  },

  // ---- NVDA (Semiconductors) ----
  {
    ticker: "NVDA",
    sector: "Semiconductors",
    insiderName: "Jensen Huang",
    role: "CEO",
    transactionCode: "S",
    sharesTraded: 100_000,
    sharePrice: 875.0,
    totalHoldingsBefore: 86_200_000,
    date: "2026-02-22",
  },
  {
    ticker: "NVDA",
    sector: "Semiconductors",
    insiderName: "Colette Kress",
    role: "EVP & CFO",
    transactionCode: "P",
    sharesTraded: 5_000,
    sharePrice: 870.25,
    totalHoldingsBefore: 150_000,
    date: "2026-02-21",
  },

  // ---- MSFT (Tech) ----
  {
    ticker: "MSFT",
    sector: "Tech",
    insiderName: "Satya Nadella",
    role: "CEO",
    transactionCode: "S",
    sharesTraded: 50_000,
    sharePrice: 415.6,
    totalHoldingsBefore: 770_000,
    date: "2026-02-22",
  },
  {
    ticker: "MSFT",
    sector: "Tech",
    insiderName: "Amy Hood",
    role: "EVP & CFO",
    transactionCode: "P",
    sharesTraded: 8_000,
    sharePrice: 412.0,
    totalHoldingsBefore: 250_000,
    date: "2026-02-21",
  },
];

// ---------------------------------------------------------------------------
// Historical Performance — price at buy vs. price 60 days later
// ---------------------------------------------------------------------------

interface BuyPerformance {
  buyPrice: number;
  priceAfter60Days: number;
  returnPct: number;
}

const HISTORICAL_PERFORMANCE: Record<string, BuyPerformance[]> = {
  "Elon Musk": [
    { buyPrice: 150.0, priceAfter60Days: 172.5, returnPct: 15.0 },
    { buyPrice: 165.0, priceAfter60Days: 184.8, returnPct: 12.0 },
    { buyPrice: 170.0, priceAfter60Days: 183.6, returnPct: 8.0 },
  ],
  "Andrew Baglino": [
    { buyPrice: 140.0, priceAfter60Days: 152.6, returnPct: 9.0 },
    { buyPrice: 155.0, priceAfter60Days: 164.3, returnPct: 6.0 },
    { buyPrice: 160.0, priceAfter60Days: 171.2, returnPct: 7.0 },
  ],
  "Luca Maestri": [
    { buyPrice: 185.0, priceAfter60Days: 203.5, returnPct: 10.0 },
    { buyPrice: 195.0, priceAfter60Days: 209.6, returnPct: 7.5 },
    { buyPrice: 210.0, priceAfter60Days: 226.8, returnPct: 8.0 },
  ],
  "Deirdre O'Brien": [
    { buyPrice: 170.0, priceAfter60Days: 190.4, returnPct: 12.0 },
    { buyPrice: 200.0, priceAfter60Days: 220.0, returnPct: 10.0 },
    { buyPrice: 215.0, priceAfter60Days: 241.8, returnPct: 12.5 },
  ],
  "Andy Jassy": [
    { buyPrice: 120.0, priceAfter60Days: 126.0, returnPct: 5.0 },
    { buyPrice: 140.0, priceAfter60Days: 144.2, returnPct: 3.0 },
    { buyPrice: 175.0, priceAfter60Days: 178.5, returnPct: 2.0 },
  ],
  "Adam Selipsky": [
    { buyPrice: 130.0, priceAfter60Days: 129.4, returnPct: -0.5 },
    { buyPrice: 155.0, priceAfter60Days: 153.5, returnPct: -1.0 },
    { buyPrice: 170.0, priceAfter60Days: 172.6, returnPct: 1.5 },
  ],
  "Colette Kress": [
    { buyPrice: 500.0, priceAfter60Days: 575.0, returnPct: 15.0 },
    { buyPrice: 620.0, priceAfter60Days: 682.0, returnPct: 10.0 },
    { buyPrice: 780.0, priceAfter60Days: 866.0, returnPct: 11.0 },
  ],
  "Amy Hood": [
    { buyPrice: 310.0, priceAfter60Days: 332.7, returnPct: 7.3 },
    { buyPrice: 350.0, priceAfter60Days: 371.0, returnPct: 6.0 },
    { buyPrice: 390.0, priceAfter60Days: 406.8, returnPct: 4.3 },
  ],
  "Robyn Denholm": [
    { buyPrice: 160.0, priceAfter60Days: 164.8, returnPct: 3.0 },
    { buyPrice: 170.0, priceAfter60Days: 176.8, returnPct: 4.0 },
    { buyPrice: 175.0, priceAfter60Days: 178.5, returnPct: 2.0 },
  ],
  "Jeff Williams": [
    { buyPrice: 190.0, priceAfter60Days: 200.5, returnPct: 5.5 },
    { buyPrice: 205.0, priceAfter60Days: 219.4, returnPct: 7.0 },
    { buyPrice: 220.0, priceAfter60Days: 233.2, returnPct: 6.0 },
  ],
};

// ---------------------------------------------------------------------------
// Insider Accuracy Rating (1-5 Stars)
//
//   5 Stars: avg return > 10%
//   4 Stars: avg return 5–10%
//   3 Stars: avg return 0–5%
//   2 Stars: avg return -5–0%
//   1 Star:  avg return < -5%
// ---------------------------------------------------------------------------

export interface InsiderRating {
  stars: number;
  avgReturn: number;
  history: BuyPerformance[];
}

export function getInsiderRating(insiderName: string): InsiderRating | null {
  const history = HISTORICAL_PERFORMANCE[insiderName];
  if (!history || history.length === 0) return null;

  const avgReturn =
    history.reduce((sum, h) => sum + h.returnPct, 0) / history.length;

  let stars: number;
  if (avgReturn > 10) stars = 5;
  else if (avgReturn >= 5) stars = 4;
  else if (avgReturn >= 0) stars = 3;
  else if (avgReturn >= -5) stars = 2;
  else stars = 1;

  return {
    stars,
    avgReturn: Math.round(avgReturn * 10) / 10,
    history,
  };
}

// ---------------------------------------------------------------------------
// Transaction Labels
// ---------------------------------------------------------------------------

export const TRANSACTION_LABELS: Record<string, string> = {
  P: "Used Personal Cash",
  S: "Insider Selling",
  A: "Company Award",
  M: "Option Exercise",
  G: "Gift",
  F: "Tax Withholding",
};

// ---------------------------------------------------------------------------
// Conviction Scoring
//
//   Code P (Buy):  >10% stake = 90+, 5-10% = 70-89, <5% = 40-69
//   Code S (Sell):  scaled 20-70 based on % sold
//   Code A (Award): always low (10-30), company-initiated
// ---------------------------------------------------------------------------

export function scoreConviction(
  code: string,
  percentageChange: number,
): number {
  switch (code.toUpperCase()) {
    case "P": {
      if (percentageChange >= 50) return 98;
      if (percentageChange >= 25) return 92;
      if (percentageChange >= 10) return 85;
      if (percentageChange >= 5) return 72;
      return Math.max(40, Math.round(percentageChange * 8));
    }
    case "S": {
      if (percentageChange >= 50) return 70;
      if (percentageChange >= 20) return 55;
      return Math.max(20, Math.round(percentageChange * 2.5));
    }
    default: {
      // A, M, G, F and other codes — low conviction
      return Math.min(30, Math.round(10 + percentageChange * 0.5));
    }
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function getProcessedTrades(ticker: string): ProcessedTrade[] {
  const normalised = ticker.trim().toUpperCase();

  return MOCK_TRADES.filter((t) => t.ticker === normalised)
    .map((trade) => {
      const tradeValue = trade.sharesTraded * trade.sharePrice;

      const percentageChange =
        trade.totalHoldingsBefore > 0
          ? (trade.sharesTraded / trade.totalHoldingsBefore) * 100
          : 0;

      const convictionScore = scoreConviction(
        trade.transactionCode,
        percentageChange,
      );

      return {
        ...trade,
        transactionLabel: TRANSACTION_LABELS[trade.transactionCode],
        tradeValue,
        percentageChange: Math.round(percentageChange * 100) / 100,
        convictionScore,
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

// ---------------------------------------------------------------------------
// Confidence Score Algorithm
//
//   Base: 50
//   Cluster Buy (+30):  3+ unique insiders with Code P in last 30 days
//   Executive Power (+20):  CEO or CFO buying
//   Skin in the Game (+15):  Any buy >10% of holdings
//   Insider Selling (-20):  For every Code S open market sale
//   Capped 0–100
// ---------------------------------------------------------------------------

export interface ConfidenceSignal {
  emoji: string;
  text: string;
  points: number;
}

export interface ConfidenceResult {
  score: number;
  label: "Caution" | "Neutral" | "High Confidence";
  signals: ConfidenceSignal[];
}

export function calculateConfidenceScore(ticker: string): ConfidenceResult {
  const normalised = ticker.trim().toUpperCase();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const trades = MOCK_TRADES.filter((t) => t.ticker === normalised);
  const recentTrades = trades.filter(
    (t) => new Date(t.date) >= thirtyDaysAgo,
  );

  let score = 50;
  const signals: ConfidenceSignal[] = [];

  // Cluster Buy: 3+ unique insiders with Code P in last 30 days
  const uniqueBuyers = new Set(
    recentTrades
      .filter((t) => t.transactionCode === "P")
      .map((t) => t.insiderName),
  );
  if (uniqueBuyers.size >= 3) {
    score += 30;
    signals.push({
      emoji: "\uD83D\uDD25",
      text: `Cluster Buy (${uniqueBuyers.size} Insiders)`,
      points: 30,
    });
  }

  // Executive Power: CEO or CFO buying
  const execBuyers = recentTrades.filter(
    (t) =>
      t.transactionCode === "P" &&
      (t.role.toUpperCase().includes("CEO") ||
        t.role.toUpperCase().includes("CFO")),
  );
  if (execBuyers.length > 0) {
    score += 20;
    const names = execBuyers.map((t) => `${t.insiderName} (${t.role})`);
    signals.push({
      emoji: "\u2705",
      text: `${names[0]} Buying Detected`,
      points: 20,
    });
  }

  // Skin in the Game: Any buy >10% of holdings
  const bigBuys = recentTrades.filter((t) => {
    if (t.transactionCode !== "P" || t.totalHoldingsBefore === 0) return false;
    return (t.sharesTraded / t.totalHoldingsBefore) * 100 > 10;
  });
  if (bigBuys.length > 0) {
    score += 15;
    const biggest = bigBuys.reduce((max, t) => {
      const pct = (t.sharesTraded / t.totalHoldingsBefore) * 100;
      const maxPct = (max.sharesTraded / max.totalHoldingsBefore) * 100;
      return pct > maxPct ? t : max;
    });
    const pct = Math.round(
      (biggest.sharesTraded / biggest.totalHoldingsBefore) * 100,
    );
    signals.push({
      emoji: "\uD83D\uDCAA",
      text: `${biggest.insiderName} increased stake by ${pct}%`,
      points: 15,
    });
  }

  // Insider Selling: -20 for every Code S sale
  const sells = recentTrades.filter((t) => t.transactionCode === "S");
  if (sells.length > 0) {
    const penalty = sells.length * 20;
    score -= penalty;
    signals.push({
      emoji: "\u26A0\uFE0F",
      text: `${sells.length} Insider Sale${sells.length > 1 ? "s" : ""} Detected`,
      points: -penalty,
    });
  }

  // Clamp 0–100
  score = Math.max(0, Math.min(100, score));

  let label: ConfidenceResult["label"];
  if (score <= 30) label = "Caution";
  else if (score <= 70) label = "Neutral";
  else label = "High Confidence";

  return { score, label, signals };
}

/** Build a confidence score from an array of ProcessedTrade objects */
export function calculateConfidenceFromTrades(
  trades: ProcessedTrade[],
): ConfidenceResult {
  let score = 50;
  const signals: ConfidenceSignal[] = [];

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

/** All tickers available in the mock dataset */
export function getAvailableTickers(): string[] {
  return [...new Set(MOCK_TRADES.map((t) => t.ticker))].sort();
}

/** Global top N trades of a given type, sorted by total dollar value */
export function getGlobalTopTrades(
  code: "P" | "S",
  limit = 10,
): ProcessedTrade[] {
  return MOCK_TRADES.filter((t) => t.transactionCode === code)
    .map((trade) => {
      const tradeValue = trade.sharesTraded * trade.sharePrice;
      const percentageChange =
        trade.totalHoldingsBefore > 0
          ? (trade.sharesTraded / trade.totalHoldingsBefore) * 100
          : 0;
      const convictionScore = scoreConviction(code, percentageChange);

      return {
        ...trade,
        transactionLabel: TRANSACTION_LABELS[trade.transactionCode],
        tradeValue,
        percentageChange: Math.round(percentageChange * 100) / 100,
        convictionScore,
      };
    })
    .sort((a, b) => b.tradeValue - a.tradeValue)
    .slice(0, limit);
}

// ---------------------------------------------------------------------------
// Sector Heat Map — sentiment by sector
// ---------------------------------------------------------------------------

export interface SectorSentiment {
  sector: Sector;
  totalBuyValue: number;
  totalSellValue: number;
  netFlow: number;
  buyCount: number;
  sellCount: number;
  /** 1-5 glow intensity based on net flow volume */
  glowLevel: number;
  /** "buying" | "selling" | "neutral" */
  direction: "buying" | "selling" | "neutral";
}

export function getSectorSentiment(): SectorSentiment[] {
  const ALL_SECTORS: Sector[] = [
    "Tech",
    "Auto & Energy",
    "E-Commerce",
    "Semiconductors",
    "Healthcare",
    "Finance",
  ];

  const sectorMap = new Map<
    Sector,
    { buyValue: number; sellValue: number; buyCount: number; sellCount: number }
  >();

  // Initialise every sector so they all appear
  for (const s of ALL_SECTORS) {
    sectorMap.set(s, { buyValue: 0, sellValue: 0, buyCount: 0, sellCount: 0 });
  }

  for (const trade of MOCK_TRADES) {
    const entry = sectorMap.get(trade.sector)!;
    const value = trade.sharesTraded * trade.sharePrice;

    if (trade.transactionCode === "P") {
      entry.buyValue += value;
      entry.buyCount++;
    } else if (trade.transactionCode === "S") {
      entry.sellValue += value;
      entry.sellCount++;
    }
  }

  // Find the max absolute net flow across sectors for relative glow scaling
  const entries = Array.from(sectorMap.entries()).map(([sector, d]) => ({
    sector,
    ...d,
    netFlow: d.buyValue - d.sellValue,
  }));

  const maxAbsFlow = Math.max(...entries.map((e) => Math.abs(e.netFlow)), 1);

  return entries.map((e) => {
    const ratio = Math.abs(e.netFlow) / maxAbsFlow;
    const glowLevel = e.netFlow === 0 ? 0 : Math.max(1, Math.ceil(ratio * 5));

    let direction: SectorSentiment["direction"];
    if (e.netFlow > 0) direction = "buying";
    else if (e.netFlow < 0) direction = "selling";
    else direction = "neutral";

    return {
      sector: e.sector,
      totalBuyValue: e.buyValue,
      totalSellValue: e.sellValue,
      netFlow: e.netFlow,
      buyCount: e.buyCount,
      sellCount: e.sellCount,
      glowLevel,
      direction,
    };
  });
}
