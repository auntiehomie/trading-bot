"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import StockForm from "@/components/trading/StockForm";
import PortfolioTable from "@/components/trading/PortfolioTable";
import { mockPaperPortfolio } from "@/lib/mock-data";
import type { PaperPosition } from "@/lib/mock-data";

interface QuoteData {
  price: number | null;
  bid: number | null;
  ask: number | null;
  timestamp: string | null;
}

interface QuoteResponse {
  marketOpen: boolean | null;
  quotes: Record<string, QuoteData>;
  unavailable?: string[];
  error?: string;
}

function applyQuotes(
  positions: PaperPosition[],
  quotes: Record<string, QuoteData>,
): PaperPosition[] {
  return positions.map((p) => {
    const q = quotes[p.ticker];
    if (!q || q.price == null) return p;
    const currentPrice = q.price;
    return {
      ...p,
      currentPrice,
      pnl: (currentPrice - p.entryPrice) * p.quantity,
      pnlPercent: ((currentPrice - p.entryPrice) / p.entryPrice) * 100,
    };
  });
}

export default function PaperTradingPage() {
  const [positions, setPositions] = useState<PaperPosition[]>(
    mockPaperPortfolio,
  );
  const [marketOpen, setMarketOpen] = useState<boolean | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const positionsRef = useRef<PaperPosition[]>(positions);
  useEffect(() => {
    positionsRef.current = positions;
  }, [positions]);

  const fetchQuotes = useCallback(
    async (tickers: string[]): Promise<QuoteResponse | null> => {
      if (tickers.length === 0) return null;
      try {
        const res = await fetch(
          `/api/paper-trading/quote?symbols=${tickers.join(",")}`,
        );
        const data = (await res.json()) as QuoteResponse;
        if (!res.ok || data.error) {
          setStatusMsg(data.error ?? "Failed to fetch quotes.");
          return null;
        }
        setMarketOpen(data.marketOpen);
        return data;
      } catch {
        setStatusMsg("Unable to reach the quote API. Please try again.");
        return null;
      }
    },
    [],
  );

  const refreshPrices = useCallback(async () => {
    setRefreshing(true);
    setStatusMsg(null);
    const tickers = positionsRef.current.map((p) => p.ticker);
    const data = await fetchQuotes(tickers);
    if (data) {
      setPositions((prev) => applyQuotes(prev, data.quotes));
    }
    setRefreshing(false);
  }, [fetchQuotes]);

  // Load real prices on first render.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const tickers = positionsRef.current.map((p) => p.ticker);
      const data = await fetchQuotes(tickers);
      if (cancelled || !data) return;
      setPositions((prev) => applyQuotes(prev, data.quotes));
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchQuotes]);

  const handleTrade = async (trade: {
    ticker: string;
    quantity: number;
    action: "buy" | "sell";
  }) => {
    setStatusMsg(null);

    const existing = positionsRef.current.find(
      (p) => p.ticker === trade.ticker,
    );

    if (trade.action === "sell" && !existing) {
      setStatusMsg(`You don't own any ${trade.ticker} to sell.`);
      return;
    }

    if (
      trade.action === "sell" &&
      existing &&
      existing.quantity < trade.quantity
    ) {
      setStatusMsg(
        `Not enough ${trade.ticker} to sell (you hold ${existing.quantity}).`,
      );
      return;
    }

    const data = await fetchQuotes([trade.ticker]);
    if (!data) return;
    const q = data.quotes[trade.ticker];
    const price = q?.price ?? null;
    if (price == null) {
      setStatusMsg(`No current price available for ${trade.ticker}.`);
      return;
    }

    setPositions((prev) => {
      const idx = prev.findIndex((p) => p.ticker === trade.ticker);
      const updated = [...prev];

      if (idx >= 0) {
        const pos = { ...updated[idx] };
        if (trade.action === "buy") {
          const totalQty = pos.quantity + trade.quantity;
          const totalCost =
            pos.quantity * pos.entryPrice + trade.quantity * price;
          pos.entryPrice = totalQty > 0 ? totalCost / totalQty : pos.entryPrice;
          pos.quantity = totalQty;
        } else {
          pos.quantity -= trade.quantity;
        }
        pos.currentPrice = price;
        pos.pnl = (price - pos.entryPrice) * pos.quantity;
        pos.pnlPercent =
          ((price - pos.entryPrice) / pos.entryPrice) * 100;
        if (pos.quantity <= 0) updated.splice(idx, 1);
        else updated[idx] = pos;
      } else if (trade.action === "buy") {
        updated.push({
          id: `p${Date.now()}`,
          ticker: trade.ticker,
          name: trade.ticker,
          quantity: trade.quantity,
          entryPrice: price,
          currentPrice: price,
          pnl: 0,
          pnlPercent: 0,
        });
      }
      return updated;
    });

    setStatusMsg(
      `Placed paper ${trade.action} of ${trade.quantity} ${trade.ticker} @ $${price.toFixed(2)}.`,
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Paper Trading</h1>
          <p className="mt-1 text-sm text-gray-500">
            Practice trading stocks with virtual money. Prices from Alpaca.
          </p>
        </div>
        <MarketBadge marketOpen={marketOpen} />
      </div>

      {statusMsg && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
          <p className="text-sm text-amber-300">{statusMsg}</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-3">
          <StockForm onTrade={handleTrade} />
          <button
            onClick={refreshPrices}
            disabled={refreshing}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {refreshing ? "Refreshing…" : "Refresh Prices"}
          </button>
        </div>
        <div className="lg:col-span-2">
          <h3 className="mb-3 text-base font-semibold text-white">
            Paper Portfolio
          </h3>
          <PortfolioTable positions={positions} />
        </div>
      </div>
    </div>
  );
}

function MarketBadge({ marketOpen }: { marketOpen: boolean | null }) {
  if (marketOpen === null) {
    return (
      <span className="rounded-full bg-gray-800 px-3 py-1 text-xs font-medium text-gray-400">
        Market status unknown
      </span>
    );
  }
  return marketOpen ? (
    <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
      Market Open
    </span>
  ) : (
    <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400">
      Market Closed — showing last prices
    </span>
  );
}
