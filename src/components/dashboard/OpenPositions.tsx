"use client";

import type { Position } from "@/lib/mock-data";

interface OpenPositionsProps {
  positions: Position[];
}

export default function OpenPositions({ positions }: OpenPositionsProps) {
  return (
    <div className="rounded-xl border border-gray-700 bg-gray-900">
      <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
        <h3 className="text-sm font-semibold text-white">Open Positions</h3>
        <span className="text-xs text-gray-500">{positions.length} positions</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-xs text-gray-500">
              <th className="px-4 py-2 font-medium">Asset</th>
              <th className="px-4 py-2 text-right font-medium">Quantity</th>
              <th className="px-4 py-2 text-right font-medium">Entry</th>
              <th className="px-4 py-2 text-right font-medium">Current</th>
              <th className="px-4 py-2 text-right font-medium">P&L</th>
              <th className="px-4 py-2 text-right font-medium">P&L %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {positions.map((pos) => (
              <tr key={pos.id} className="hover:bg-gray-800/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{pos.symbol}</span>
                    <span className="rounded bg-gray-800 px-1.5 py-0.5 text-[10px] text-gray-500">
                      {pos.type}
                    </span>
                  </div>
                </td>
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
    </div>
  );
}