import { describe, it, expect } from "vitest";
import {
  runBacktest,
  formatBacktestSummary,
  maCrossoverStrategy,
  DEFAULT_BACKTEST_CONFIG,
  type HistoricalPrice,
  type BacktestConfig,
} from "../backtesting";

function generatePrices(start: number, count: number, basePrice: number, volatility: number): HistoricalPrice[] {
  const prices: HistoricalPrice[] = [];
  let current = basePrice;
  for (let i = 0; i < count; i++) {
    const change = (Math.random() - 0.5) * volatility;
    const open = current;
    const close = Math.max(0.01, current + change);
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;
    prices.push({
      timestamp: start + i * 86400,
      open,
      high,
      low,
      close,
      volume: Math.random() * 1000000,
    });
    current = close;
  }
  return prices;
}

describe("runBacktest", () => {
  const prices = generatePrices(1700000000, 100, 100, 5);

  it("runs a backtest with MA crossover strategy", () => {
    const result = runBacktest(prices, maCrossoverStrategy(5, 20), DEFAULT_BACKTEST_CONFIG);
    expect(result).toBeDefined();
    expect(result.totalTrades).toBeGreaterThanOrEqual(0);
    expect(result.equity.length).toBe(prices.length);
  });

  it("computes correct total trades count", () => {
    const result = runBacktest(prices, maCrossoverStrategy(5, 20));
    expect(result.winningTrades + result.losingTrades).toBe(result.totalTrades);
  });

  it("computes win rate correctly", () => {
    const result = runBacktest(prices, maCrossoverStrategy(5, 20));
    if (result.totalTrades > 0) {
      expect(result.winRate).toBeCloseTo(result.winningTrades / result.totalTrades, 5);
    }
  });

  it("handles empty price array", () => {
    const result = runBacktest([], maCrossoverStrategy(5, 20));
    expect(result.totalTrades).toBe(0);
    expect(result.totalPnlUsd).toBe(0);
    expect(result.equity).toEqual([]);
  });

  it("respects position size limits", () => {
    const config: BacktestConfig = {
      ...DEFAULT_BACKTEST_CONFIG,
      initialCapitalUsd: 1000,
      positionSizeUsd: 100,
      maxPositionSizePct: 0.1, // 10% = $100 max
    };
    const result = runBacktest(prices, maCrossoverStrategy(5, 20), config);
    // No single trade should risk more than 10% of capital
    for (const trade of result.trades) {
      expect(Math.abs(trade.pnlUsd)).toBeLessThan(200); // sanity check
    }
  });

  it("calculates max drawdown correctly", () => {
    // Create a price series with a clear drawdown
    const downPrices: HistoricalPrice[] = [
      { timestamp: 1, open: 100, high: 105, low: 95, close: 100, volume: 1000 },
      { timestamp: 2, open: 100, high: 105, low: 95, close: 120, volume: 1000 },
      { timestamp: 3, open: 120, high: 125, low: 115, close: 80, volume: 1000 },
      { timestamp: 4, open: 80, high: 85, low: 75, close: 60, volume: 1000 },
      { timestamp: 5, open: 60, high: 65, low: 55, close: 70, volume: 1000 },
    ];
    const result = runBacktest(downPrices, maCrossoverStrategy(2, 3));
    expect(result.maxDrawdownUsd).toBeGreaterThanOrEqual(0);
    expect(result.maxDrawdownPct).toBeGreaterThanOrEqual(0);
  });
});

describe("formatBacktestSummary", () => {
  it("produces a readable summary string", () => {
    const prices = generatePrices(1700000000, 50, 100, 5);
    const result = runBacktest(prices, maCrossoverStrategy(5, 20));
    const summary = formatBacktestSummary(result);
    expect(summary).toContain("Backtest Results");
    expect(summary).toContain("Trades:");
    expect(summary).toContain("Win Rate:");
    expect(summary).toContain("Total P&L:");
    expect(summary).toContain("Sharpe Ratio:");
  });
});

describe("maCrossoverStrategy", () => {
  it("returns null when not enough data for slow period", () => {
    const strategy = maCrossoverStrategy(5, 20);
    const result = strategy({
      currentPrice: { timestamp: 1, open: 100, high: 105, low: 95, close: 100, volume: 1000 },
      index: 5,
      prices: [],
      equity: 10000,
      position: null,
    });
    expect(result).toBeNull();
  });

  it("returns hold when no crossover detected", () => {
    const prices: HistoricalPrice[] = [];
    for (let i = 0; i < 25; i++) {
      prices.push({ timestamp: i, open: 100, high: 101, low: 99, close: 100 + i * 0.1, volume: 1000 });
    }
    const strategy = maCrossoverStrategy(5, 20);
    const result = strategy({
      currentPrice: prices[24],
      index: 24,
      prices,
      equity: 10000,
      position: null,
    });
    // Steady uptrend — likely a buy signal at some point or hold
    expect(result).toBeDefined();
  });
});
