/**
 * Backtesting framework — simulate trading strategies against historical data.
 *
 * Supports:
 * - Loading historical price data (CSV, API, or inline arrays)
 * - Running strategies with configurable parameters
 * - Computing performance metrics (P&L, win rate, max drawdown, Sharpe ratio)
 * - Slippage + gas simulation for realistic results
 */


export interface HistoricalPrice {
  timestamp: number; // unix seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface BacktestTrade {
  timestamp: number;
  side: "buy" | "sell";
  price: number;
  amount: number;
  gasCostUsd: number;
  slippageCostUsd: number;
  pnlUsd: number;
  cumulativePnlUsd: number;
}

export interface BacktestResult {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalPnlUsd: number;
  totalReturnPct: number;
  maxDrawdownUsd: number;
  maxDrawdownPct: number;
  sharpeRatio: number;
  avgTradePnlUsd: number;
  avgWinUsd: number;
  avgLossUsd: number;
  profitFactor: number; // gross profit / gross loss
  trades: BacktestTrade[];
  equity: { timestamp: number; value: number }[];
}

export interface BacktestConfig {
  initialCapitalUsd: number;
  positionSizeUsd: number;
  maxPositionSizePct: number; // max % of capital per position
  slippageBps: number;
  gasCostUsd: number; // simulated gas cost per trade
  feeBps: number; // DEX fee per trade
}

export const DEFAULT_BACKTEST_CONFIG: BacktestConfig = {
  initialCapitalUsd: 10_000,
  positionSizeUsd: 1_000,
  maxPositionSizePct: 0.25,
  slippageBps: 30,
  gasCostUsd: 0.50,
  feeBps: 0, // 1inch typically 0 fee
};

/**
 * Strategy interface — a function that receives current market state
 * and returns a trade signal (or null to hold).
 */
export type Strategy = (
  context: {
    currentPrice: HistoricalPrice;
    index: number;
    prices: HistoricalPrice[];
    equity: number;
    position: { entryPrice: number; amount: number; side: "buy" | "sell" } | null;
  },
) => { action: "buy" | "sell" | "hold"; reason?: string } | null;

/**
 * Run a backtest with historical data and a strategy.
 */
export function runBacktest(
  prices: HistoricalPrice[],
  strategy: Strategy,
  config: BacktestConfig = DEFAULT_BACKTEST_CONFIG,
): BacktestResult {
  const trades: BacktestTrade[] = [];
  const equity: { timestamp: number; value: number }[] = [];
  let capitalUsd = config.initialCapitalUsd;
  let position: { entryPrice: number; amount: number; side: "buy" | "sell" } | null = null;
  let peakEquity = config.initialCapitalUsd;
  let maxDrawdownUsd = 0;
  let maxDrawdownPct = 0;

  const BPS_DIVISOR = 10_000;
  let grossProfit = 0;
  let grossLoss = 0;
  const dailyReturns: number[] = [];

  for (let i = 0; i < prices.length; i++) {
    const current = prices[i];
    const equityValue = capitalUsd + (position
      ? (current.close - position.entryPrice) * position.amount * (position.side === "buy" ? 1 : -1)
      : 0);

    equity.push({ timestamp: current.timestamp, value: equityValue });

    // Track drawdown
    if (equityValue > peakEquity) peakEquity = equityValue;
    const drawdown = peakEquity - equityValue;
    if (drawdown > maxDrawdownUsd) {
      maxDrawdownUsd = drawdown;
      maxDrawdownPct = (drawdown / peakEquity) * 100;
    }

    const signal = strategy({
      currentPrice: current,
      index: i,
      prices,
      equity: equityValue,
      position,
    });

    if (!signal || signal.action === "hold") {
      // Track daily return for Sharpe
      if (i > 0) {
        const prevClose = prices[i - 1].close;
        const ret = (current.close - prevClose) / prevClose;
        dailyReturns.push(ret);
      }
      continue;
    }

    // Calculate trade costs
    const positionSize = Math.min(
      config.positionSizeUsd,
      capitalUsd * config.maxPositionSizePct,
    );
    const amount = positionSize / current.close;
    const slippageCostUsd = positionSize * (config.slippageBps / BPS_DIVISOR);
    const feeCostUsd = positionSize * (config.feeBps / BPS_DIVISOR);
    const totalCost = config.gasCostUsd + slippageCostUsd + feeCostUsd;

    if (signal.action === "buy" && !position) {
      position = { entryPrice: current.close, amount, side: "buy" };
      capitalUsd -= totalCost;
    } else if (signal.action === "sell" && position) {
      const pnl = (current.close - position.entryPrice) * position.amount - totalCost;
      const cumulativePnl = capitalUsd + pnl;
      capitalUsd += pnl;

      const trade: BacktestTrade = {
        timestamp: current.timestamp,
        side: "sell",
        price: current.close,
        amount,
        gasCostUsd: config.gasCostUsd,
        slippageCostUsd: slippageCostUsd,
        pnlUsd: pnl,
        cumulativePnlUsd: cumulativePnl,
      };
      trades.push(trade);

      if (pnl > 0) grossProfit += pnl;
      else grossLoss += Math.abs(pnl);

      position = null;
    }

    // Track daily return
    if (i > 0) {
      const prevClose = prices[i - 1].close;
      const ret = (current.close - prevClose) / prevClose;
      dailyReturns.push(ret);
    }
  }

  // Close any remaining position at last price
  if (position && prices.length > 0) {
    const lastPrice = prices[prices.length - 1].close;
    const pnl = (lastPrice - position.entryPrice) * position.amount;
    capitalUsd += pnl;
    trades.push({
      timestamp: prices[prices.length - 1].timestamp,
      side: "sell",
      price: lastPrice,
      amount: position.amount,
      gasCostUsd: config.gasCostUsd,
      slippageCostUsd: 0,
      pnlUsd: pnl,
      cumulativePnlUsd: capitalUsd,
    });
    if (pnl > 0) grossProfit += pnl;
    else grossLoss += Math.abs(pnl);
  }

  // Compute metrics
  const totalTrades = trades.length;
  const winningTrades = trades.filter((t) => t.pnlUsd > 0).length;
  const losingTrades = trades.filter((t) => t.pnlUsd <= 0).length;
  const winRate = totalTrades > 0 ? winningTrades / totalTrades : 0;
  const totalPnlUsd = capitalUsd - config.initialCapitalUsd;
  const totalReturnPct = (totalPnlUsd / config.initialCapitalUsd) * 100;
  const avgTradePnlUsd = totalTrades > 0 ? totalPnlUsd / totalTrades : 0;
  const avgWinUsd = winningTrades > 0
    ? trades.filter((t) => t.pnlUsd > 0).reduce((sum, t) => sum + t.pnlUsd, 0) / winningTrades
    : 0;
  const avgLossUsd = losingTrades > 0
    ? trades.filter((t) => t.pnlUsd <= 0).reduce((sum, t) => sum + Math.abs(t.pnlUsd), 0) / losingTrades
    : 0;
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

  // Sharpe ratio (simplified — annualized from daily returns)
  const avgReturn = dailyReturns.length > 0
    ? dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length
    : 0;
  const stdDev = dailyReturns.length > 1
    ? Math.sqrt(
        dailyReturns.reduce((sum, r) => sum + (r - avgReturn) ** 2, 0) /
          (dailyReturns.length - 1),
      )
    : 0;
  const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(365) : 0;

  return {
    totalTrades,
    winningTrades,
    losingTrades,
    winRate,
    totalPnlUsd,
    totalReturnPct,
    maxDrawdownUsd,
    maxDrawdownPct,
    sharpeRatio,
    avgTradePnlUsd,
    avgWinUsd,
    avgLossUsd,
    profitFactor,
    trades,
    equity,
  };
}

/**
 * Format a backtest result as a human-readable summary.
 */
export function formatBacktestSummary(result: BacktestResult): string {
  const lines = [
    "═══ Backtest Results ═══",
    `Trades:       ${result.totalTrades} (${result.winningTrades}W / ${result.losingTrades}L)`,
    `Win Rate:     ${(result.winRate * 100).toFixed(1)}%`,
    `Total P&L:    ${result.totalPnlUsd >= 0 ? "+" : ""}$${result.totalPnlUsd.toFixed(2)}`,
    `Total Return: ${result.totalReturnPct >= 0 ? "+" : ""}${result.totalReturnPct.toFixed(2)}%`,
    `Max Drawdown: $${result.maxDrawdownUsd.toFixed(2)} (${result.maxDrawdownPct.toFixed(2)}%)`,
    `Sharpe Ratio: ${result.sharpeRatio.toFixed(3)}`,
    `Profit Factor: ${result.profitFactor.toFixed(2)}`,
    `Avg Trade:    ${result.avgTradePnlUsd >= 0 ? "+" : ""}$${result.avgTradePnlUsd.toFixed(2)}`,
    `Avg Win:      +$${result.avgWinUsd.toFixed(2)}`,
    `Avg Loss:     -$${result.avgLossUsd.toFixed(2)}`,
    "═════════════════════════",
  ];
  return lines.join("\n");
}

/**
 * Simple moving average crossover strategy for backtesting.
 * Buys when fast MA crosses above slow MA, sells when it crosses below.
 */
export function maCrossoverStrategy(fastPeriod: number, slowPeriod: number): Strategy {
  return ({ index, prices }: { index: number; prices: HistoricalPrice[] }) => {
    if (index < slowPeriod) return null;

    const fastMA =
      prices.slice(index - fastPeriod + 1, index + 1).reduce((sum, p) => sum + p.close, 0) /
      fastPeriod;
    const slowMA =
      prices.slice(index - slowPeriod + 1, index + 1).reduce((sum, p) => sum + p.close, 0) /
      slowPeriod;

    const prevFastMA =
      prices.slice(index - fastPeriod, index).reduce((sum, p) => sum + p.close, 0) /
      fastPeriod;
    const prevSlowMA =
      prices.slice(index - slowPeriod, index).reduce((sum, p) => sum + p.close, 0) /
      slowPeriod;

    // Bullish crossover
    if (prevFastMA <= prevSlowMA && fastMA > slowMA) {
      return { action: "buy", reason: "Fast MA crossed above slow MA" };
    }
    // Bearish crossover
    if (prevFastMA >= prevSlowMA && fastMA < slowMA) {
      return { action: "sell", reason: "Fast MA crossed below slow MA" };
    }

    return { action: "hold" };
  };
}
