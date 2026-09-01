"use client";

import { useState, useEffect } from "react";
import { mockPortfolioSummary as summary } from "@/lib/mock-data";
import { priceMonitor, type PriceUpdate } from "@/lib/priceMonitor";

export default function PortfolioSummary() {
  const [ethPrice, setEthPrice] = useState<PriceUpdate | null>(() => {
    const existing = priceMonitor["prices"].get("ETH");
    if (existing) return existing;
    const fallback: PriceUpdate = { token: "ETH", priceUsd: 3215.5, timestamp: Date.now(), source: "cache" };
    priceMonitor["prices"].set("ETH", fallback);
    return fallback;
  });
  const [arbPrice, setArbPrice] = useState<PriceUpdate | null>(() => {
    const existing = priceMonitor["prices"].get("ARB");
    if (existing) return existing;
    const fallback: PriceUpdate = { token: "ARB", priceUsd: 0.95, timestamp: Date.now(), source: "cache" };
    priceMonitor["prices"].set("ARB", fallback);
    return fallback;
  });

  useEffect(() => {
    // Subscribe to live price updates from the PriceMonitor
    const unsubEth = priceMonitor.subscribe("ETH", (update) => setEthPrice(update));
    const unsubArb = priceMonitor.subscribe("ARB", (update) => setArbPrice(update));

    return () => {
      unsubEth();
      unsubArb();
    };
  }, []);

  const cards = [
    {
      label: "Total Value",
      value: `$${summary.totalValue.toLocaleString()}`,
      change: null,
    },
    {
      label: "Total P&L",
      value: `$${summary.totalPnl.toLocaleString()}`,
      change: `${summary.totalPnlPercent >= 0 ? "+" : ""}${summary.totalPnlPercent.toFixed(2)}%`,
      positive: summary.totalPnl >= 0,
    },
    {
      label: "Escrow Balance",
      value: `${summary.escrowBalance} ETH`,
      change: null,
    },
    {
      label: "Buying Power",
      value: `$${summary.buyingPower.toLocaleString()}`,
      change: null,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-gray-700 bg-gray-900 p-4"
          >
            <p className="text-xs text-gray-500">{card.label}</p>
            <p className="mt-1 text-xl font-bold text-white">{card.value}</p>
            {card.change !== null && (
              <p
                className={`mt-1 text-xs font-medium ${
                  card.positive ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {card.change}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Live Price Ticker */}
      <div className="flex items-center gap-6 rounded-lg border border-gray-800 bg-gray-900/50 px-4 py-2">
        <span className="text-xs font-semibold text-gray-500">LIVE</span>
        {ethPrice && (
          <span className="text-xs text-gray-300">
            ETH <span className="font-mono text-white">${ethPrice.priceUsd.toFixed(2)}</span>
            {ethPrice.changePct && ethPrice.changePct !== 0 && (
              <span className={ethPrice.changePct >= 0 ? "text-emerald-400" : "text-red-400"}>
                {" "}({ethPrice.changePct >= 0 ? "+" : ""}{ethPrice.changePct.toFixed(2)}%)
              </span>
            )}
          </span>
        )}
        {arbPrice && (
          <span className="text-xs text-gray-300">
            ARB <span className="font-mono text-white">${arbPrice.priceUsd.toFixed(4)}</span>
            {arbPrice.changePct && arbPrice.changePct !== 0 && (
              <span className={arbPrice.changePct >= 0 ? "text-emerald-400" : "text-red-400"}>
                {" "}({arbPrice.changePct >= 0 ? "+" : ""}{arbPrice.changePct.toFixed(2)}%)
              </span>
            )}
          </span>
        )}
        <span className="ml-auto text-xs text-gray-600">
          {ethPrice ? `via ${ethPrice.source}` : "connecting..."}
        </span>
      </div>
    </div>
  );
}