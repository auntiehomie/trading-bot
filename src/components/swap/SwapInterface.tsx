"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { formatUnits, parseUnits } from "viem";
import { ARBITRUM_TOKENS, tokenBySymbol, type Token } from "@/lib/tokens";

interface QuoteResponse {
  toAmount?: string;
  fromToken?: { symbol?: string; decimals?: number };
  toToken?: { symbol?: string; decimals?: number };
  protocols?: { name?: string }[][] | string[];
  estimatedGas?: number;
}

const SLIPPAGE_BPS = 50; // 0.5%

function formatRate(value: number): string {
  if (value === 0) return "0";
  if (value >= 1000) return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (value >= 1) return value.toFixed(4);
  return value.toPrecision(4);
}

export default function SwapInterface() {
  const [fromToken, setFromToken] = useState<Token>(ARBITRUM_TOKENS[0]);
  const [toToken, setToToken] = useState<Token>(ARBITRUM_TOKENS[1]);
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [rate, setRate] = useState<string | null>(null);
  const [minReceived, setMinReceived] = useState<string | null>(null);
  const [route, setRoute] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchQuote = useCallback(async () => {
    const value = Number(fromAmount);
    if (!fromAmount || value <= 0) {
      setToAmount("");
      setRate(null);
      setMinReceived(null);
      setRoute(null);
      setError(null);
      return;
    }
    if (fromToken.address === toToken.address) {
      setError("Please select two different tokens.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const amount = parseUnits(fromAmount, fromToken.decimals).toString();
      const url = new URL("/api/swap/quote", window.location.origin);
      url.searchParams.set("src", fromToken.address);
      url.searchParams.set("dst", toToken.address);
      url.searchParams.set("amount", amount);

      const res = await fetch(url.toString());
      const data = (await res.json()) as QuoteResponse & { error?: string };

      if (!res.ok || data.error) {
        setError(data.error ?? "Failed to fetch quote.");
        setToAmount("");
        setRate(null);
        setMinReceived(null);
        setRoute(null);
        return;
      }

      if (!data.toAmount) {
        setError("No liquidity available for this pair.");
        setToAmount("");
        setRate(null);
        setMinReceived(null);
        setRoute(null);
        return;
      }

      const out = BigInt(data.toAmount);
      const outDisplay = formatUnits(out, toToken.decimals);
      setToAmount(Number(outDisplay).toFixed(6));

      const rateNum =
        Number(formatUnits(out, toToken.decimals)) / Number(fromAmount);
      setRate(
        `1 ${fromToken.symbol} = ${formatRate(rateNum)} ${toToken.symbol}`,
      );

      const minOut = (out * BigInt(10000 - SLIPPAGE_BPS)) / BigInt(10000);
      setMinReceived(Number(formatUnits(minOut, toToken.decimals)).toFixed(6));

      const protocols = collectProtocols(data.protocols);
      setRoute(protocols.length ? protocols.join(" → ") : "Best route");
    } catch {
      setError("Unable to reach the swap API. Please try again.");
      setToAmount("");
      setRate(null);
      setMinReceived(null);
      setRoute(null);
    } finally {
      setLoading(false);
    }
  }, [fromAmount, fromToken, toToken]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchQuote, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [fetchQuote]);

  const handleSwapTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount("");
    setToAmount("");
    setRate(null);
    setMinReceived(null);
    setRoute(null);
    setError(null);
  };

  const selectToken = (
    setter: (t: Token) => void,
    symbol: string,
    other: Token,
  ) => {
    const token = tokenBySymbol(symbol);
    if (!token) return;
    // Prevent selecting the same token on both sides.
    if (token.address === other.address) {
      setError("Source and destination tokens must differ.");
      return;
    }
    setter(token);
    setError(null);
  };

  const hasQuote = Boolean(toAmount && rate);

  return (
    <div className="mx-auto max-w-md space-y-4">
      <h2 className="text-lg font-semibold text-white">Swap Tokens</h2>
      <p className="text-sm text-gray-500">
        Live quotes from 1inch across the best routes on Arbitrum.
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
            onChange={(e) => setFromAmount(e.target.value)}
            className="w-full bg-transparent text-2xl text-white outline-none placeholder:text-gray-600"
          />
          <div className="relative">
            <select
              value={fromToken.symbol}
              onChange={(e) =>
                selectToken(setFromToken, e.target.value, toToken)
              }
              className="appearance-none rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none"
            >
              {ARBITRUM_TOKENS.map((t) => (
                <option key={t.symbol} value={t.symbol}>
                  {t.icon} {t.symbol}
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
          aria-label="Swap direction"
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
              onChange={(e) =>
                selectToken(setToToken, e.target.value, fromToken)
              }
              className="appearance-none rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none"
            >
              {ARBITRUM_TOKENS.map((t) => (
                <option key={t.symbol} value={t.symbol}>
                  {t.icon} {t.symbol}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Loading / Error / Quote */}
      {loading && (
        <p className="text-center text-sm text-gray-500">Fetching best quote…</p>
      )}

      {!loading && error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {!loading && !error && hasQuote && (
        <div className="space-y-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
          <p className="text-sm font-medium text-emerald-400">{rate}</p>
          {route && (
            <p className="text-xs text-gray-500">Route: {route}</p>
          )}
          {minReceived && (
            <p className="text-xs text-gray-500">
              Min received ({SLIPPAGE_BPS / 100}% slippage): {minReceived}{" "}
              {toToken.symbol}
            </p>
          )}
        </div>
      )}

      {/* Action Button */}
      <button
        disabled={!hasQuote || loading}
        className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Swap
      </button>

      <p className="text-center text-xs text-gray-600">
        Quotes via 1inch Aggregation API. On-chain swap execution is coming soon.
      </p>
    </div>
  );
}

function collectProtocols(
  protocols: QuoteResponse["protocols"],
): string[] {
  if (!protocols || protocols.length === 0) return [];
  const names = new Set<string>();
  for (const step of protocols) {
    if (Array.isArray(step)) {
      for (const p of step) {
        if (p?.name) names.add(p.name);
      }
    } else if (typeof step === "string") {
      names.add(step);
    }
  }
  return Array.from(names);
}
