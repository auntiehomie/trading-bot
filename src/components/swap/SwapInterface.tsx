"use client";

import { useState } from "react";

const tokens = [
  { symbol: "ETH", name: "Ethereum", icon: "⟠" },
  { symbol: "ARB", name: "Arbitrum", icon: "🔷" },
  { symbol: "USDC", name: "USD Coin", icon: "💲" },
  { symbol: "USDT", name: "Tether", icon: "💵" },
  { symbol: "LINK", name: "Chainlink", icon: "🔗" },
];

export default function SwapInterface() {
  const [fromToken, setFromToken] = useState(tokens[0]);
  const [toToken, setToToken] = useState(tokens[2]);
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [quote, setQuote] = useState<string | null>(null);

  const handleGetQuote = () => {
    if (!fromAmount || Number(fromAmount) <= 0) return;
    const rate = fromToken.symbol === "ETH" ? 3215.5 : 1.0;
    setToAmount((Number(fromAmount) * rate).toFixed(6));
    setQuote(
      `1 ${fromToken.symbol} = ${rate.toFixed(2)} ${toToken.symbol}`,
    );
  };

  const handleSwapTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount("");
    setToAmount("");
    setQuote(null);
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

      {/* Action Button */}
      <button
        onClick={handleGetQuote}
        disabled={!fromAmount || Number(fromAmount) <= 0}
        className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Get Quote
      </button>

      <p className="text-center text-xs text-gray-600">
        Swaps execute via the best available route on Arbitrum.
      </p>
    </div>
  );
}