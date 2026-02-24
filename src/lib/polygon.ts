// ---------------------------------------------------------------------------
// Polygon.io API Client
//
// Used server-side only (API routes). The key is read from POLYGON_API_KEY.
//
// Polygon provides:
//   - Ticker details (company name, sector, market cap)
//   - EDGAR Filing Index (Form 4 metadata — dates, counts, filing URLs)
//
// Polygon does NOT provide parsed Form 4 fields (insider name, transaction
// code, shares, price). For that, the mock service remains the structured
// data source until a dedicated insider API is integrated.
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
  }>;
}

export async function getInsiderFilings(
  ticker: string,
  limit = 20,
): Promise<{ filings: FilingEntry[]; totalCount: number }> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const dateFrom = thirtyDaysAgo.toISOString().split("T")[0];

  const data = await polygonFetch<EdgarIndexResponse>(
    "/stocks/filings/vX/index",
    {
      ticker: ticker.toUpperCase(),
      form_type: "4",
      "filing_date.gte": dateFrom,
      limit: String(limit),
      sort: "filing_date.desc",
    },
  );

  const filings: FilingEntry[] = (data.results ?? []).map((r) => ({
    accessionNumber: r.accession_number,
    ticker: r.ticker ?? ticker.toUpperCase(),
    formType: r.form_type,
    filingDate: r.filing_date,
    filingUrl: r.filing_url ?? "",
    issuerName: r.issuer_name ?? "",
  }));

  return { filings, totalCount: data.count ?? filings.length };
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
