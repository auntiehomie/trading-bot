"use client";

import { useState } from "react";
import StockForm from "@/components/trading/StockForm";
import PortfolioTable from "@/components/trading/PortfolioTable";
import { mockPaperPortfolio } from "@/lib/mock-data";
import type { PaperPosition } from "@/lib/mock-data";

export default function PaperTradingPage() {
  const [positions, setPositions] =
    useState<PaperPosition[]>(mockPaperPortfolio);

  const handleTrade = (trade: {
    ticker: string;
    quantity: number;
    action: "buy" | "sell";
  }) => {
    const mockPrice = trade.ticker.length * 20 + 100;
    const existingIdx = positions.findIndex((p) => p.ticker === trade.ticker);

    if (existingIdx >= 0) {
      const updated = [...positions];
      const existing = updated[existingIdx];
      if (trade.action === "buy") {
        existing.quantity += trade.quantity;
      } else {
        existing.quantity -= trade.quantity;
      }
      existing.currentPrice = mockPrice;
      existing.pnl =
        (existing.currentPrice - existing.entryPrice) * existing.quantity;
      existing.pnlPercent =
        ((existing.currentPrice - existing.entryPrice) / existing.entryPrice) *
        100;
      if (existing.quantity <= 0) {
        updated.splice(existingIdx, 1);
      }
      setPositions(updated);
    } else if (trade.action === "buy") {
      const newPosition: PaperPosition = {
        id: `p${Date.now()}`,
        ticker: trade.ticker,
        name: `${trade.ticker} Inc.`,
        quantity: trade.quantity,
        entryPrice: mockPrice,
        currentPrice: mockPrice,
        pnl: 0,
        pnlPercent: 0,
      };
      setPositions([...positions, newPosition]);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Paper Trading</h1>
        <p className="mt-1 text-sm text-gray-500">
          Practice trading stocks with virtual money. No real funds at risk.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div>
          <StockForm onTrade={handleTrade} />
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