/**
 * Profitability Engine — gas cost + slippage + profit calculation.
 * Adapted from Liquidation Bot's ProfitabilityCalculator patterns.
 *
 * Estimates whether a trade will be profitable after accounting for:
 * - Gas costs (L1 + L2 components where applicable)
 * - Slippage tolerance and expected price impact
 * - Protocol fees (DEX router fees, relay fees)
 * - Bridge fees for cross-chain trades
 */

export interface TradeEstimate {
  tokenIn: string;
  tokenOut: string;
  amountIn: bigint;          // raw units (wei)
  amountOut: bigint;         // expected raw units from quote
  priceInUsd: number;       // USD price of tokenIn
  priceOutUsd: number;      // USD price of tokenOut
  gasEstimate: bigint;      // estimated gas units
  gasPriceGwei: number;     // current gas price in gwei
  gasCostUsd: number;       // estimated gas cost in USD
  slippageBps: number;      // slippage in basis points (100 = 1%)
  protocolFeeBps: number;   // protocol fee in bps
  bridgeFeeUsd: number;     // bridge fee if cross-chain
  netProfitUsd: number;     // estimated net profit in USD
  netProfitPct: number;     // net profit as percentage of input
  isProfitable: boolean;    // true if netProfitUsd > minProfitUsd
}

export interface ProfitabilityConfig {
  minProfitUsd: number;       // minimum profit threshold to execute
  maxSlippageBps: number;     // max acceptable slippage (default: 300 = 3%)
  gasPriceGwei: number;       // current gas price
  ethPriceUsd: number;        // ETH price for gas cost conversion
  protocolFeeBps: number;     // DEX protocol fee (default: 0 for 1inch)
  bridgeFeeUsd: number;       // bridge fee if cross-chain (default: 0)
  gasLimitEstimate: number;   // estimated gas units for a swap (default: 200000)
}

export const DEFAULT_CONFIG: ProfitabilityConfig = {
  minProfitUsd: 5.0,
  maxSlippageBps: 300, // 3%
  gasPriceGwei: 0.1,   // Arbitrum typical
  ethPriceUsd: 3200,
  protocolFeeBps: 0,
  bridgeFeeUsd: 0,
  gasLimitEstimate: 200_000,
};

const GWEI_TO_ETH = 1e-9;
const BPS_DIVISOR = 10_000;

/**
 * Calculate gas cost in USD from gas estimate + price.
 */
export function estimateGasCostUsd(
  gasUnits: bigint,
  gasPriceGwei: number,
  ethPriceUsd: number,
): number {
  const gasEth = Number(gasUnits) * gasPriceGwei * GWEI_TO_ETH;
  return gasEth * ethPriceUsd;
}

/**
 * Calculate slippage impact in USD.
 * Slippage = (expected price - actual execution price) / expected price
 */
export function calculateSlippageImpact(
  amountOut: bigint,
  expectedAmountOut: bigint,
  priceOutUsd: number,
  decimalsOut: number = 18,
): { slippageBps: number; impactUsd: number } {
  if (expectedAmountOut === BigInt(0)) return { slippageBps: 0, impactUsd: 0 };

  const expected = Number(expectedAmountOut) / 10 ** decimalsOut;
  const actual = Number(amountOut) / 10 ** decimalsOut;
  const diff = expected - actual;
  const slippageBps = Math.round((diff / expected) * BPS_DIVISOR);
  const impactUsd = diff * priceOutUsd;
  return { slippageBps, impactUsd };
}

/**
 * Compute a full profitability estimate for a trade.
 */
export function evaluateTrade(
  quote: {
    tokenIn: string;
    tokenOut: string;
    amountIn: bigint;
    amountOut: bigint;
    priceInUsd: number;
    priceOutUsd: number;
    decimalsIn: number;
    decimalsOut: number;
    gasEstimate?: bigint;
  },
  config: ProfitabilityConfig = DEFAULT_CONFIG,
): TradeEstimate {
  const gasEstimate = quote.gasEstimate ?? BigInt(config.gasLimitEstimate);
  const gasCostUsd = estimateGasCostUsd(
    gasEstimate,
    config.gasPriceGwei,
    config.ethPriceUsd,
  );

  // Input value in USD
  const inputValueUsd =
    (Number(quote.amountIn) / 10 ** quote.decimalsIn) * quote.priceInUsd;

  // Output value in USD (expected)
  const expectedOutputValueUsd =
    (Number(quote.amountOut) / 10 ** quote.decimalsOut) * quote.priceOutUsd;

  // Protocol fee impact
  const protocolFeeUsd =
    expectedOutputValueUsd * (config.protocolFeeBps / BPS_DIVISOR);

  // Slippage estimate: use the configured max as a conservative estimate
  // In production, this would come from the actual quote's price impact
  const slippageImpactUsd =
    expectedOutputValueUsd * (config.maxSlippageBps / BPS_DIVISOR);

  // Net profit = output value - input value - gas - fees - slippage - bridge
  const netProfitUsd =
    expectedOutputValueUsd -
    inputValueUsd -
    gasCostUsd -
    protocolFeeUsd -
    slippageImpactUsd -
    config.bridgeFeeUsd;

  const netProfitPct = inputValueUsd > 0 ? (netProfitUsd / inputValueUsd) * 100 : 0;
  const isProfitable = netProfitUsd >= config.minProfitUsd;

  return {
    tokenIn: quote.tokenIn,
    tokenOut: quote.tokenOut,
    amountIn: quote.amountIn,
    amountOut: quote.amountOut,
    priceInUsd: quote.priceInUsd,
    priceOutUsd: quote.priceOutUsd,
    gasEstimate,
    gasPriceGwei: config.gasPriceGwei,
    gasCostUsd,
    slippageBps: config.maxSlippageBps,
    protocolFeeBps: config.protocolFeeBps,
    bridgeFeeUsd: config.bridgeFeeUsd,
    netProfitUsd,
    netProfitPct,
    isProfitable,
  };
}

/**
 * Check if a trade should be executed based on profitability + slippage constraints.
 */
export function shouldExecute(
  estimate: TradeEstimate,
  config: ProfitabilityConfig,
): { execute: boolean; reason?: string } {
  if (!estimate.isProfitable) {
    return {
      execute: false,
      reason: `Net profit $${estimate.netProfitUsd.toFixed(2)} below minimum $${config.minProfitUsd}`,
    };
  }
  if (estimate.slippageBps > config.maxSlippageBps) {
    return {
      execute: false,
      reason: `Slippage ${estimate.slippageBps / 100}% exceeds max ${(config.maxSlippageBps / 100)}%`,
    };
  }
  return { execute: true };
}

/**
 * Format a trade estimate for logging/alerts.
 */
export function formatEstimate(estimate: TradeEstimate): string {
  const sign = estimate.netProfitUsd >= 0 ? "+" : "-";
  return [
    `${estimate.tokenIn}→${estimate.tokenOut}`,
    `Gas: $${estimate.gasCostUsd.toFixed(4)}`,
    `Slippage: ${(estimate.slippageBps / 100).toFixed(2)}%`,
    `Net: ${sign}$${Math.abs(estimate.netProfitUsd).toFixed(2)} (${estimate.netProfitPct.toFixed(2)}%)`,
    estimate.isProfitable ? "PROFITABLE" : "NOT PROFITABLE",
  ].join(" | ");
}
