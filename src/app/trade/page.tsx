"use client";

import SwapInterface from "@/components/swap/SwapInterface";

export default function TradePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Trade</h1>
        <p className="mt-1 text-sm text-gray-500">
          Swap tokens with best-course routing on Arbitrum.
        </p>
      </div>

      <SwapInterface />

      <div className="mx-auto max-w-md rounded-xl border border-gray-700 bg-gray-900 p-5">
        <h3 className="mb-2 text-sm font-semibold text-white">
          Best-Course Swap Routing
        </h3>
        <p className="text-xs text-gray-500 leading-relaxed">
          Quotes are fetched live from the 1inch Aggregation API, which routes
          across Arbitrum DEXes (Uniswap, SushiSwap, Camelot) to minimize
          slippage. On-chain swap execution via your connected wallet is coming
          soon.
        </p>
      </div>
    </div>
  );
}