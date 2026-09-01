"use client";

import { useState, useEffect, useCallback } from "react";
import { evaluateTrade, type TradeEstimate, DEFAULT_CONFIG } from "@/lib/profitability";
import { priceMonitor, type PriceUpdate } from "@/lib/priceMonitor";

const tokens = [
  { symbol: "ETH", name: "Ethereum", icon: "⟠", decimals: 18 },
  { symbol: "ARB", name: "Arbitrum", icon: "🔷", decimals: 18 },
  { symbol: "USDC", name: "USD Coin", icon: "💲", decimals: 6 },
  { symbol: "USDT", name: "Tether", icon: "💵", decimals: 6 },
  { symbol: "LINK", name: "Chainlink", icon: "🔗", decimals: 18 },
];

// Mock prices for scaffold — in production these come from priceMonitor / oracle
const mockPrices: Record<string, number> = {
  ETH: 3215.5,
  ARB: 0.95,
  USDC: 1.0,
  USDT: 1.0,
  LINK: 14.2,
};

export default function SwapInterface() {
  const [fromToken, setFromToken] = useState(tokens[0]);
  const [toToken, setToToken] = useState(tokens[2]);
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [quote, setQuote] = useState<string | null>(null);
  const [estimate, setEstimate] = useState<TradeEstimate | null>(null);
  const [priceUpdate, setPriceUpdate] = useState<PriceUpdate | null>(null);

  // Subscribe to price updates for fromToken
  useEffect(() => {
    const unsub = priceMonitor.subscribe(fromToken.symbol, (update) => {
      setPriceUpdate(update);
    });
    return () => unsub();
  }, [fromToken.symbol]);

  const handleGetQuote = useCallback(() => {
    if (!fromAmount || Number(fromAmount) <= 0) return;
    const rate = mockPrices[fromToken.symbol] / mockPrices[toToken.symbol];
    const inputAmount = Number(fromAmount);
    const outputAmount = inputAmount * rate;
    setToAmount(outputAmount.toFixed(6));
    setQuote(`1 ${fromToken.symbol} = ${rate.toFixed(4)} ${toToken.symbol}`);

    // Run profitability evaluation
    const tradeEstimate = evaluateTrade({
      tokenIn: fromToken.symbol,
      tokenOut: toToken.symbol,
      amountIn: BigInt(Math.floor(inputAmount * 10 ** fromToken.decimals)),
      amountOut: BigInt(Math.floor(outputAmount * 10 ** toToken.decimals)),
      priceInUsd: mockPrices[fromToken.symbol],
      priceOutUsd: mockPrices[toToken.symbol],
      decimalsIn: fromToken.decimals,
      decimalsOut: toToken.decimals,
    }, DEFAULT_CONFIG);
    setEstimate(tradeEstimate);
  }, [fromAmount, fromToken, toToken]);

  const handleSwapTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount("");
    setToAmount("");
    setQuote(null);
    setEstimate(null);
  };

  return (
    <div className="mx-auto max-w-md space-y-4">
      <h2 className="text-lg font-semibold text-white">Swap Tokens</h2>
      <p className="text-sm text-gray-500">
        Swap tokens across the best available routes on Arbitrum.
      </p>

      {/* From Token */}
      <div className="rounded-xl border border-gray-700 bg-gray-900 p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs text-gray-500">You pay</span>
          <span className="text-xs text-gray-500">Balance: 0.00</span>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="number"
            placeholder="0.0"
            value={fromAmount}
            onChange={(e) => {
              setFromAmount(e.target.value);
              setQuote(null);
            }}
            className="w-full bg-transparent text-2xl text-white outline-none placeholder:text-gray-600"
          />
          <div className="relative">
            <select
              value={fromToken.symbol}
              onChange={(e) => {
                const token = tokens.find((t) => t.symbol === e.target.value);
                if (token) setFromToken(token);
                setQuote(null);
              }}
              className="appearance-none rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none"
            >
              {tokens.map((t) => (
                <option key={t.symbol} value={t.symbol}>
                  {t.symbol}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Swap Direction Button */}
      <div className="flex justify-center">
        <button
          onClick={handleSwapTokens}
          className="rounded-full border border-gray-700 bg-gray-900 p-2 text-gray-400 transition-colors hover:border-gray-600 hover:text-white"
        >
          ↓↑
        </button>
      </div>

      {/* To Token */}
      <div className="rounded-xl border border-gray-700 bg-gray-900 p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs text-gray-500">You receive</span>
          <span className="text-xs text-gray-500">Balance: 0.00</span>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="0.0"
            value={toAmount}
            readOnly
            className="w-full bg-transparent text-2xl text-white outline-none placeholder:text-gray-600"
          />
          <div className="relative">
            <select
              value={toToken.symbol}
              onChange={(e) => {
                const token = tokens.find((t) => t.symbol === e.target.value);
                if (token) setToToken(token);
                setQuote(null);
              }}
              className="appearance-none rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none"
            >
              {tokens.map((t) => (
                <option key={t.symbol} value={t.symbol}>
                  {t.symbol}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Quote */}
      {quote && (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
          <p className="text-sm text-emerald-400">{quote}</p>
        </div>
      )}

      {/* Profitability Estimate */}
      {estimate && (
        <div className={`rounded-lg border p-3 ${estimate.isProfitable ? "border-emerald-500/30 bg-emerald-500/5" : "border-amber-500/30 bg-amber-500/5"}`}>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Est. Gas Cost</span>
            <span className="text-gray-300">${estimate.gasCostUsd.toFixed(4)}</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-xs">
            <span className="text-gray-500">Est. Slippage</span>
            <span className="text-gray-300">{(estimate.slippageBps / 100).toFixed(2)}%</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-xs">
            <span className="text-gray-500">Net Profit</span>
            <span className={estimate.netProfitUsd >= 0 ? "text-emerald-400" : "text-red-400"}>
              {estimate.netProfitUsd >= 0 ? "+" : ""}${estimate.netProfitUsd.toFixed(2)} ({estimate.netProfitPct.toFixed(2)}%)
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${estimate.isProfitable ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}`}>
              {estimate.isProfitable ? "✓ PROFITABLE" : "⚠ LOW PROFIT"}
            </span>
          </div>
          {priceUpdate && (
            <p className="mt-1 text-xs text-gray-600">
              Live price: ${priceUpdate.priceUsd.toFixed(2)} ({priceUpdate.source})
            </p>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleGetQuote}
          disabled={!fromAmount || Number(fromAmount) <= 0}
          className="flex-1 rounded-xl bg-gray-700 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Get Quote
        </button>
        <button
          disabled={!estimate || !estimate.isProfitable}
          className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${estimate?.isProfitable ? "bg-emerald-600 hover:bg-emerald-500" : "bg-gray-700"}`}
        >
          Execute Swap
        </button>
      </div>

      <p className="text-center text-xs text-gray-600">
        Swaps execute via the best available route on Arbitrum.
      </p>
    </div>
  );
}