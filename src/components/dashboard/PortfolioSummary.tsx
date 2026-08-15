"use client";

import { mockPortfolioSummary as summary } from "@/lib/mock-data";

export default function PortfolioSummary() {
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
  );
}