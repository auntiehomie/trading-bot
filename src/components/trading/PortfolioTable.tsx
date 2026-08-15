"use client";

import type { PaperPosition } from "@/lib/mock-data";

interface PortfolioTableProps {
  positions: PaperPosition[];
}

export default function PortfolioTable({ positions }: PortfolioTableProps) {
  if (positions.length === 0) {
    return (
      <div className="rounded-xl border border-gray-700 bg-gray-900 p-8 text-center">
        <p className="text-gray-500">No paper positions yet.</p>
        <p className="mt-1 text-sm text-gray-600">
          Place your first paper trade to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-700 bg-gray-900">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-gray-800 text-xs text-gray-500">
            <th className="px-4 py-3 font-medium">Ticker</th>
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 text-right font-medium">Qty</th>
            <th className="px-4 py-3 text-right font-medium">Entry</th>
            <th className="px-4 py-3 text-right font-medium">Current</th>
            <th className="px-4 py-3 text-right font-medium">P&L</th>
            <th className="px-4 py-3 text-right font-medium">P&L %</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {positions.map((pos) => (
            <tr key={pos.id} className="hover:bg-gray-800/50">
              <td className="px-4 py-3 font-medium text-white">{pos.ticker}</td>
              <td className="px-4 py-3 text-gray-400">{pos.name}</td>
              <td className="px-4 py-3 text-right text-white">{pos.quantity}</td>
              <td className="px-4 py-3 text-right text-gray-400">
                ${pos.entryPrice.toFixed(2)}
              </td>
              <td className="px-4 py-3 text-right text-white">
                ${pos.currentPrice.toFixed(2)}
              </td>
              <td
                className={`px-4 py-3 text-right font-medium ${
                  pos.pnl >= 0 ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {pos.pnl >= 0 ? "+" : ""}${pos.pnl.toFixed(2)}
              </td>
              <td
                className={`px-4 py-3 text-right font-medium ${
                  pos.pnlPercent >= 0 ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {pos.pnlPercent >= 0 ? "+" : ""}
                {pos.pnlPercent.toFixed(2)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}