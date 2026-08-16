import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const DATA_API = "https://data.alpaca.markets";
const PAPER_API = "https://paper-api.alpaca.markets";

interface Snapshot {
  symbol?: string;
  latestTrade?: { p?: number; t?: string } | null;
  latestQuote?: { ap?: number; bp?: number; t?: string } | null;
  dailyBar?: { c?: number } | null;
  prevDailyBar?: { c?: number } | null;
}

function env(name: string): string | null {
  const v = process.env[name];
  return v && v.trim() ? v.trim() : null;
}

function priceFromSnapshot(snap: Snapshot): {
  price: number | null;
  bid: number | null;
  ask: number | null;
  timestamp: string | null;
} {
  const bid = snap.latestQuote?.bp ?? null;
  const ask = snap.latestQuote?.ap ?? null;
  let price: number | null = null;
  if (snap.latestTrade?.p) {
    price = snap.latestTrade.p;
  } else if (bid != null && ask != null && bid > 0 && ask > 0) {
    price = (bid + ask) / 2;
  } else if (snap.dailyBar?.c) {
    price = snap.dailyBar.c;
  } else if (snap.prevDailyBar?.c) {
    price = snap.prevDailyBar.c;
  }
  const timestamp = snap.latestTrade?.t ?? snap.latestQuote?.t ?? null;
  return { price, bid, ask, timestamp };
}

/**
 * Real-time stock quotes from Alpaca (paper/data feed).
 *
 * GET /api/paper-trading/quote?symbols=AAPL,NVDA
 * Returns the latest price plus bid/ask and the current market session status.
 */
export async function GET(request: Request) {
  const apiKey = env("ALPACA_API_KEY");
  const secretKey = env("ALPACA_SECRET_KEY");

  if (!apiKey || !secretKey) {
    return NextResponse.json(
      {
        error:
          "Alpaca API keys not configured. Set ALPACA_API_KEY and ALPACA_SECRET_KEY in .env.local.",
      },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(request.url);
  const symbolsParam =
    searchParams.get("symbols") ?? searchParams.get("symbol") ?? "";

  const symbols = Array.from(
    new Set(
      symbolsParam
        .split(",")
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean),
    ),
  );

  if (symbols.length === 0) {
    return NextResponse.json(
      { error: "Missing query param: symbols (comma-separated)." },
      { status: 400 },
    );
  }

  const headers = {
    "APCA-API-KEY-ID": apiKey,
    "APCA-API-SECRET-KEY": secretKey,
  };

  const snapshotPromises = symbols.map(async (symbol) => {
    const res = await fetch(`${DATA_API}/v2/stocks/${symbol}/snapshot`, {
      headers,
      cache: "no-store",
    });
    if (!res.ok) return { symbol, snapshot: null, error: res.status };
    const snapshot = (await res.json()) as Snapshot;
    return { symbol, snapshot, error: null };
  });

  const [clockResult, ...snapshotResults] = await Promise.all([
    fetch(`${PAPER_API}/v2/clock`, { headers, cache: "no-store" })
      .then(async (res) => (res.ok ? res.json() : null))
      .catch(() => null),
    ...snapshotPromises,
  ]);

  const marketOpen =
    clockResult && typeof clockResult.is_open === "boolean"
      ? clockResult.is_open
      : null;

  const quotes: Record<
    string,
    {
      price: number | null;
      bid: number | null;
      ask: number | null;
      timestamp: string | null;
    }
  > = {};

  const failures: string[] = [];

  for (const r of snapshotResults) {
    if (!r.snapshot) {
      failures.push(`${r.symbol} (HTTP ${r.error})`);
      quotes[r.symbol] = { price: null, bid: null, ask: null, timestamp: null };
      continue;
    }
    quotes[r.symbol] = priceFromSnapshot(r.snapshot);
    if (quotes[r.symbol].price == null) failures.push(r.symbol);
  }

  return NextResponse.json({ marketOpen, quotes, unavailable: failures });
}
