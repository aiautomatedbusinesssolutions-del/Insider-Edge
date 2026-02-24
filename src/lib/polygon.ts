// ---------------------------------------------------------------------------
// Polygon.io API Client + SEC EDGAR Form 4 Parser
//
// Used server-side only (API routes). The key is read from POLYGON_API_KEY.
// ---------------------------------------------------------------------------

const BASE_URL = "https://api.polygon.io";

function getApiKey(): string {
  const key = process.env.POLYGON_API_KEY;
  if (!key || key === "your_api_key_here") {
    throw new Error(
      "POLYGON_API_KEY is not configured. Add it to .env.local.",
    );
  }
  return key;
}

async function polygonFetch<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  url.searchParams.set("apiKey", getApiKey());
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
  }

  const res = await fetch(url.toString(), { next: { revalidate: 300 } });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Polygon API ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Ticker Details — company name, sector, market cap
// ---------------------------------------------------------------------------

export interface TickerDetails {
  ticker: string;
  name: string;
  description: string;
  sector: string;
  industry: string;
  marketCap: number;
  homepageUrl: string;
  iconUrl: string;
  listDate: string;
  totalEmployees: number;
}

interface TickerDetailsResponse {
  status: string;
  results: {
    ticker: string;
    name: string;
    description?: string;
    sic_description?: string;
    market_cap?: number;
    homepage_url?: string;
    branding?: { icon_url?: string };
    list_date?: string;
    total_employees?: number;
  };
}

export async function getTickerDetails(
  ticker: string,
): Promise<TickerDetails> {
  const data = await polygonFetch<TickerDetailsResponse>(
    `/v3/reference/tickers/${ticker.toUpperCase()}`,
  );

  const r = data.results;
  return {
    ticker: r.ticker,
    name: r.name,
    description: r.description ?? "",
    sector: r.sic_description ?? "Unknown",
    industry: r.sic_description ?? "Unknown",
    marketCap: r.market_cap ?? 0,
    homepageUrl: r.homepage_url ?? "",
    iconUrl: r.branding?.icon_url ?? "",
    listDate: r.list_date ?? "",
    totalEmployees: r.total_employees ?? 0,
  };
}

// ---------------------------------------------------------------------------
// EDGAR Filing Index — Form 4 insider filing metadata
// ---------------------------------------------------------------------------

export interface FilingEntry {
  accessionNumber: string;
  ticker: string;
  formType: string;
  filingDate: string;
  filingUrl: string;
  issuerName: string;
}

interface EdgarIndexResponse {
  status: string;
  count: number;
  next_url?: string;
  results: Array<{
    accession_number: string;
    ticker?: string;
    form_type: string;
    filing_date: string;
    filing_url?: string;
    issuer_name?: string;
    cik?: string;
  }>;
}

export async function getInsiderFilings(
  ticker: string,
  limit = 20,
  lookbackDays = 30,
): Promise<{ filings: FilingEntry[]; totalCount: number }> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - lookbackDays);
  const dateFrom = cutoff.toISOString().split("T")[0];

  const data = await polygonFetch<EdgarIndexResponse>(
    "/stocks/filings/vX/index",
    {
      ticker: ticker.toUpperCase(),
      "form_type.any_of": "4,4/A",
      "filing_date.gte": dateFrom,
      limit: String(limit),
      sort: "filing_date.desc",
    },
  );

  console.log(
    `[Polygon EDGAR] ${ticker.toUpperCase()} — ${data.count ?? 0} filings found (lookback ${lookbackDays}d)`,
  );

  const filings: FilingEntry[] = (data.results ?? []).map((r) => {
    // Build filing URL from accession number if Polygon doesn't provide one
    let url = r.filing_url ?? "";
    if (!url && r.accession_number) {
      const clean = r.accession_number.replace(/-/g, "");
      const cik = r.cik ?? "";
      if (cik) {
        url = `https://www.sec.gov/Archives/edgar/data/${cik}/${clean}/`;
      }
    }

    return {
      accessionNumber: r.accession_number,
      ticker: r.ticker ?? ticker.toUpperCase(),
      formType: r.form_type,
      filingDate: r.filing_date,
      filingUrl: url,
      issuerName: r.issuer_name ?? "",
    };
  });

  if (filings.length > 0) {
    console.log(
      `[Polygon EDGAR] Sample filing URLs:`,
      filings.slice(0, 3).map((f) => ({
        date: f.filingDate,
        url: f.filingUrl || "(empty)",
        accession: f.accessionNumber,
      })),
    );
  }

  return { filings, totalCount: data.count ?? filings.length };
}

// ---------------------------------------------------------------------------
// SEC EDGAR Direct Search — Fallback when Polygon returns no filing URLs
//
// Uses the free SEC EDGAR full-text search API (EFTS).
// No API key needed. Rate limit: 10 req/s with User-Agent header.
// ---------------------------------------------------------------------------

interface EdgarSearchResult {
  hits: {
    hits: Array<{
      _source: {
        file_num?: string;
        display_names?: string[];
        file_date: string;
        form_type: string;
        file_url?: string;
      };
      _id: string;
    }>;
    total: { value: number };
  };
}

async function searchEdgarDirect(
  ticker: string,
  lookbackDays: number,
  limit: number,
): Promise<FilingEntry[]> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - lookbackDays);
  const startDate = cutoff.toISOString().split("T")[0];
  const endDate = new Date().toISOString().split("T")[0];

  const url = new URL("https://efts.sec.gov/LATEST/search-index");
  url.searchParams.set("q", `"${ticker.toUpperCase()}"`);
  url.searchParams.set("forms", "4,4/A");
  url.searchParams.set("dateRange", "custom");
  url.searchParams.set("startdt", startDate);
  url.searchParams.set("enddt", endDate);
  url.searchParams.set("from", "0");
  url.searchParams.set("size", String(limit));

  try {
    const res = await fetch(url.toString(), {
      headers: { "User-Agent": "InsiderEdge/1.0 contact@example.com" },
    });
    if (!res.ok) {
      console.log(`[SEC EDGAR Direct] Search failed: ${res.status}`);
      return [];
    }

    const data = (await res.json()) as EdgarSearchResult;
    console.log(
      `[SEC EDGAR Direct] ${ticker.toUpperCase()} — ${data.hits?.total?.value ?? 0} filings found`,
    );

    return (data.hits?.hits ?? []).map((hit) => ({
      accessionNumber: hit._id ?? "",
      ticker: ticker.toUpperCase(),
      formType: hit._source.form_type,
      filingDate: hit._source.file_date,
      filingUrl: hit._source.file_url
        ? `https://www.sec.gov${hit._source.file_url}`
        : "",
      issuerName: hit._source.display_names?.[0] ?? "",
    }));
  } catch (err) {
    console.log(`[SEC EDGAR Direct] Error:`, err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Form 4 XML Parser
//
// Fetches the actual Form 4 XML from SEC EDGAR and extracts trade details.
// Supports all acquisition/disposition codes, derivative transactions,
// and 10b5-1 planned trades.
// ---------------------------------------------------------------------------

export interface ParsedForm4Trade {
  insiderName: string;
  role: string;
  transactionCode: string;
  sharesTraded: number;
  sharePrice: number;
  sharesOwnedAfter: number;
  filingDate: string;
  ticker: string;
  is10b51Plan: boolean;
}

// All SEC transaction codes we consider
// P = Purchase, S = Sale, A = Award/Grant, M = Option Exercise,
// J = Other Acquisition, K = Equity Swap, I = Discretionary,
// F = Tax Withholding, G = Gift, C = Conversion
const ACQUISITION_CODES = new Set(["P", "A", "J", "K", "I", "M", "C"]);
const DISPOSITION_CODES = new Set(["S", "F", "G", "D"]);
const ALL_TRADE_CODES = new Set([...ACQUISITION_CODES, ...DISPOSITION_CODES]);

async function parseForm4Filing(
  filing: FilingEntry,
): Promise<ParsedForm4Trade[]> {
  try {
    if (!filing.filingUrl) {
      console.log(
        `[Parser] Skipping filing ${filing.accessionNumber} — no URL`,
      );
      return [];
    }

    const indexUrl = filing.filingUrl.endsWith("/")
      ? filing.filingUrl
      : `${filing.filingUrl}/`;

    console.log(`[Parser] Fetching index: ${indexUrl}`);

    const indexRes = await fetch(indexUrl, {
      headers: { "User-Agent": "InsiderEdge/1.0 contact@example.com" },
      redirect: "follow",
    });

    if (!indexRes.ok) {
      console.log(`[Parser] Index fetch failed: ${indexRes.status} for ${indexUrl}`);
      // Try the URL without trailing slash as a direct document
      return tryDirectXmlFetch(filing);
    }

    const indexHtml = await indexRes.text();

    // Try multiple patterns to find the XML document
    const xmlMatch =
      // Pattern 1: Standard .xml link
      indexHtml.match(/href="([^"]*(?:doc4|primary_doc|form4)[^"]*\.xml)"/i) ??
      // Pattern 2: Any .xml file
      indexHtml.match(/href="([^"]*\.xml)"/i) ??
      // Pattern 3: Check for the filing document link
      indexHtml.match(/href="(\/Archives\/edgar\/data\/[^"]*\.xml)"/i);

    if (!xmlMatch) {
      console.log(`[Parser] No XML link found in index page for ${filing.accessionNumber}`);
      // Try the URL itself as a direct XML document
      return tryDirectXmlFetch(filing);
    }

    let xmlPath = xmlMatch[1];
    if (!xmlPath.startsWith("http")) {
      if (xmlPath.startsWith("/")) {
        xmlPath = `https://www.sec.gov${xmlPath}`;
      } else {
        // Relative path
        const base = new URL(indexUrl);
        xmlPath = `${base.origin}${base.pathname.replace(/[^/]*$/, "")}${xmlPath}`;
      }
    }

    console.log(`[Parser] Fetching XML: ${xmlPath}`);

    const xmlRes = await fetch(xmlPath, {
      headers: { "User-Agent": "InsiderEdge/1.0 contact@example.com" },
    });

    if (!xmlRes.ok) {
      console.log(`[Parser] XML fetch failed: ${xmlRes.status}`);
      return [];
    }

    const xml = await xmlRes.text();
    const trades = extractTradesFromXml(xml, filing);
    console.log(`[Parser] Extracted ${trades.length} trades from ${filing.accessionNumber}`);
    return trades;
  } catch (err) {
    console.log(`[Parser] Error parsing ${filing.accessionNumber}:`, err);
    return [];
  }
}

/** Try fetching the filing URL directly as an XML document */
async function tryDirectXmlFetch(
  filing: FilingEntry,
): Promise<ParsedForm4Trade[]> {
  try {
    // Try without trailing slash
    const url = filing.filingUrl.replace(/\/$/, "");
    const res = await fetch(url, {
      headers: { "User-Agent": "InsiderEdge/1.0 contact@example.com" },
    });
    if (!res.ok) return [];

    const text = await res.text();
    // Check if it's XML
    if (text.includes("<ownershipDocument") || text.includes("<nonDerivativeTransaction")) {
      console.log(`[Parser] Direct URL is XML for ${filing.accessionNumber}`);
      return extractTradesFromXml(text, filing);
    }
    return [];
  } catch {
    return [];
  }
}

function extractTradesFromXml(
  xml: string,
  filing: FilingEntry,
): ParsedForm4Trade[] {
  const trades: ParsedForm4Trade[] = [];

  // Extract reporting owner (insider) name
  const nameMatch = xml.match(/<rptOwnerName>([^<]+)<\/rptOwnerName>/);
  let insiderName = nameMatch ? nameMatch[1].trim() : "Unknown Insider";

  // Normalise "LAST FIRST MIDDLE" → "First Last"
  if (insiderName === insiderName.toUpperCase() && insiderName.includes(" ")) {
    const parts = insiderName.split(/\s+/);
    insiderName = parts
      .reverse()
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
      .join(" ");
  }

  // Extract relationship/title
  const titleMatch = xml.match(/<officerTitle>([^<]+)<\/officerTitle>/);
  const isDirector = /<isDirector>(?:true|1)<\/isDirector>/i.test(xml);
  const isOfficer = /<isOfficer>(?:true|1)<\/isOfficer>/i.test(xml);
  const isTenPctOwner = /<isTenPercentOwner>(?:true|1)<\/isTenPercentOwner>/i.test(xml);
  let role = titleMatch ? titleMatch[1].trim() : "";
  if (!role && isDirector) role = "Director";
  if (!role && isOfficer) role = "Officer";
  if (!role && isTenPctOwner) role = "10%+ Owner";
  if (!role) role = "Insider";

  // Check for 10b5-1 plan
  const is10b51Plan = /10b5-1/i.test(xml) || /<is10b51>/i.test(xml);

  // Extract ALL non-derivative transactions (not just P/S)
  const nonDerivBlocks = xml.match(
    /<nonDerivativeTransaction>[\s\S]*?<\/nonDerivativeTransaction>/g,
  ) ?? [];

  // Also extract derivative transactions (options, warrants, etc.)
  const derivBlocks = xml.match(
    /<derivativeTransaction>[\s\S]*?<\/derivativeTransaction>/g,
  ) ?? [];

  const allBlocks = [...nonDerivBlocks, ...derivBlocks];

  for (const block of allBlocks) {
    const codeMatch = block.match(
      /<transactionCode>([^<]+)<\/transactionCode>/,
    );
    const sharesMatch = block.match(
      /<transactionShares>\s*<value>([^<]+)<\/value>/,
    );
    const priceMatch = block.match(
      /<transactionPricePerShare>\s*<value>([^<]+)<\/value>/,
    );
    const holdingsMatch = block.match(
      /<sharesOwnedFollowingTransaction>\s*<value>([^<]+)<\/value>/,
    );

    const code = codeMatch?.[1]?.trim().toUpperCase() ?? "";
    const shares = parseFloat(sharesMatch?.[1] ?? "0");
    const price = parseFloat(priceMatch?.[1] ?? "0");
    const holdingsAfter = parseFloat(holdingsMatch?.[1] ?? "0");

    // Accept any recognised transaction code with shares > 0
    // Allow price = 0 for awards (Code A) and exercises (Code M)
    if (ALL_TRADE_CODES.has(code) && shares > 0) {
      trades.push({
        insiderName,
        role,
        transactionCode: code,
        sharesTraded: shares,
        sharePrice: price,
        sharesOwnedAfter: holdingsAfter,
        filingDate: filing.filingDate,
        ticker: filing.ticker,
        is10b51Plan,
      });
    }
  }

  return trades;
}

/**
 * Fetch Form 4 filings and parse them into structured insider trades.
 * Tries Polygon first, falls back to direct SEC EDGAR search.
 */
export async function getParsedInsiderTrades(
  ticker: string,
  lookbackDays = 180,
  maxFilings = 15,
): Promise<ParsedForm4Trade[]> {
  // Step 1: Get filing list from Polygon
  let { filings } = await getInsiderFilings(ticker, maxFilings, lookbackDays);

  // Step 2: If Polygon returned no filings or no URLs, try SEC EDGAR directly
  const filingsWithUrls = filings.filter((f) => f.filingUrl);
  if (filingsWithUrls.length === 0) {
    console.log(
      `[Pipeline] Polygon returned ${filings.length} filings but ${filingsWithUrls.length} have URLs. Falling back to SEC EDGAR direct search.`,
    );
    filings = await searchEdgarDirect(ticker, lookbackDays, maxFilings);
    console.log(
      `[Pipeline] SEC EDGAR direct returned ${filings.length} filings`,
    );
  }

  const allTrades: ParsedForm4Trade[] = [];

  // Step 3: Parse each filing's XML
  for (const filing of filings) {
    const parsed = await parseForm4Filing(filing);
    allTrades.push(...parsed);
    // Delay to respect SEC's 10 req/s limit
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  console.log(
    `[Pipeline] ${ticker.toUpperCase()} total: ${allTrades.length} trades from ${filings.length} filings`,
  );

  return allTrades;
}

// ---------------------------------------------------------------------------
// Stock Price — latest closing price
// ---------------------------------------------------------------------------

export interface StockPrice {
  ticker: string;
  close: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  date: string;
}

interface PrevCloseResponse {
  status: string;
  results: Array<{
    T: string;
    c: number;
    o: number;
    h: number;
    l: number;
    v: number;
    t: number;
  }>;
}

export async function getLatestPrice(
  ticker: string,
): Promise<StockPrice | null> {
  try {
    const data = await polygonFetch<PrevCloseResponse>(
      `/v2/aggs/ticker/${ticker.toUpperCase()}/prev`,
    );

    const r = data.results?.[0];
    if (!r) return null;

    return {
      ticker: r.T,
      close: r.c,
      open: r.o,
      high: r.h,
      low: r.l,
      volume: r.v,
      date: new Date(r.t).toISOString().split("T")[0],
    };
  } catch {
    return null;
  }
}
