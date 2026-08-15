"use client";

import { useState } from "react";

interface StockFormProps {
  onTrade: (trade: {
    ticker: string;
    quantity: number;
    action: "buy" | "sell";
  }) => void;
}

export default function StockForm({ onTrade }: StockFormProps) {
  const [ticker, setTicker] = useState("");
  const [quantity, setQuantity] = useState("");
  const [action, setAction] = useState<"buy" | "sell">("buy");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticker || !quantity) return;
    onTrade({ ticker: ticker.toUpperCase(), quantity: Number(quantity), action });
    setTicker("");
    setQuantity("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-gray-700 bg-gray-900 p-5">
      <h3 className="text-base font-semibold text-white">New Paper Trade</h3>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-gray-400">
          Action
        </label>
        <div className="flex rounded-lg border border-gray-700 bg-gray-800 p-1">
          <button
            type="button"
            onClick={() => setAction("buy")}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              action === "buy"
                ? "bg-emerald-600 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Buy
          </button>
          <button
            type="button"
            onClick={() => setAction("sell")}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              action === "sell"
                ? "bg-red-600 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Sell
          </button>
        </div>
      </div>

      <div>
        <label
          htmlFor="ticker"
          className="mb-1.5 block text-xs font-medium text-gray-400"
        >
          Stock Ticker
        </label>
        <input
          id="ticker"
          type="text"
          placeholder="e.g. AAPL"
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
          className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none placeholder:text-gray-600 focus:border-emerald-500/50"
        />
      </div>

      <div>
        <label
          htmlFor="quantity"
          className="mb-1.5 block text-xs font-medium text-gray-400"
        >
          Quantity (shares)
        </label>
        <input
          id="quantity"
          type="number"
          placeholder="0"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none placeholder:text-gray-600 focus:border-emerald-500/50"
        />
      </div>

      <button
        type="submit"
        disabled={!ticker || !quantity}
        className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Place {action === "buy" ? "Buy" : "Sell"} Order (Paper)
      </button>
    </form>
  );
}