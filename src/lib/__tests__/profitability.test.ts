import { describe, it, expect } from "vitest";
import {
  evaluateTrade,
  shouldExecute,
  estimateGasCostUsd,
  calculateSlippageImpact,
  formatEstimate,
  DEFAULT_CONFIG,
} from "../profitability";

describe("estimateGasCostUsd", () => {
  it("calculates gas cost correctly for typical Arbitrum values", () => {
    const gas = BigInt(200_000);
    const gwei = 0.1;
    const ethPrice = 3200;
    // 200000 * 0.1 gwei * 1e-9 = 0.00002 ETH * 3200 = $0.064
    const cost = estimateGasCostUsd(gas, gwei, ethPrice);
    expect(cost).toBeCloseTo(0.064, 2);
  });

  it("returns 0 for zero gas", () => {
    expect(estimateGasCostUsd(BigInt(0), 100, 3000)).toBe(0);
  });
});

describe("calculateSlippageImpact", () => {
  it("calculates positive slippage when actual < expected", () => {
    const result = calculateSlippageImpact(
      BigInt(980),  // actual
      BigInt(1000), // expected
      3200,         // price
      0,            // decimals
    );
    expect(result.slippageBps).toBe(200); // 2%
    expect(result.impactUsd).toBeCloseTo(64000, 0); // 20 * 3200
  });

  it("returns 0 slippage when amounts are equal", () => {
    const result = calculateSlippageImpact(BigInt(1000), BigInt(1000), 100, 0);
    expect(result.slippageBps).toBe(0);
    expect(result.impactUsd).toBe(0);
  });

  it("handles zero expected amount gracefully", () => {
    const result = calculateSlippageImpact(BigInt(100), BigInt(0), 100, 18);
    expect(result.slippageBps).toBe(0);
    expect(result.impactUsd).toBe(0);
  });
});

describe("evaluateTrade", () => {
  it("evaluates a profitable ETH→USDC trade", () => {
    const estimate = evaluateTrade({
      tokenIn: "ETH",
      tokenOut: "USDC",
      amountIn: BigInt(1e18),        // 1 ETH
      amountOut: BigInt(3200e6),     // 3200 USDC (6 decimals)
      priceInUsd: 3200,
      priceOutUsd: 1,
      decimalsIn: 18,
      decimalsOut: 6,
    });
    expect(estimate.tokenIn).toBe("ETH");
    expect(estimate.tokenOut).toBe("USDC");
    expect(estimate.gasCostUsd).toBeGreaterThan(0);
    expect(estimate.netProfitUsd).toBeDefined();
  });

  it("marks trade as not profitable when input equals output value", () => {
    const estimate = evaluateTrade({
      tokenIn: "USDC",
      tokenOut: "USDT",
      amountIn: BigInt(1000e6),
      amountOut: BigInt(1000e6),
      priceInUsd: 1,
      priceOutUsd: 1,
      decimalsIn: 6,
      decimalsOut: 6,
    });
    // Same value in/out, but gas + slippage makes it a net loss
    expect(estimate.isProfitable).toBe(false);
    expect(estimate.netProfitUsd).toBeLessThan(0);
  });

  it("uses custom config values", () => {
    const estimate = evaluateTrade({
      tokenIn: "ETH",
      tokenOut: "USDC",
      amountIn: BigInt(1e18),
      amountOut: BigInt(3300e6),
      priceInUsd: 3200,
      priceOutUsd: 1,
      decimalsIn: 18,
      decimalsOut: 6,
    }, { ...DEFAULT_CONFIG, minProfitUsd: 1000, gasPriceGwei: 1 });
    expect(estimate.gasPriceGwei).toBe(1);
  });
});

describe("shouldExecute", () => {
  it("returns execute=true for profitable trade within slippage", () => {
    const estimate = evaluateTrade({
      tokenIn: "ETH",
      tokenOut: "USDC",
      amountIn: BigInt(10e18),
      amountOut: BigInt(33000e6),
      priceInUsd: 3200,
      priceOutUsd: 1,
      decimalsIn: 18,
      decimalsOut: 6,
    });
    const result = shouldExecute(estimate, DEFAULT_CONFIG);
    expect(result.execute).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it("returns execute=false with reason for unprofitable trade", () => {
    const estimate = evaluateTrade({
      tokenIn: "USDC",
      tokenOut: "USDT",
      amountIn: BigInt(100e6),
      amountOut: BigInt(100e6),
      priceInUsd: 1,
      priceOutUsd: 1,
      decimalsIn: 6,
      decimalsOut: 6,
    });
    const result = shouldExecute(estimate, DEFAULT_CONFIG);
    expect(result.execute).toBe(false);
    expect(result.reason).toContain("Net profit");
  });
});

describe("formatEstimate", () => {
  it("produces a readable string with all fields", () => {
    const estimate = evaluateTrade({
      tokenIn: "ETH",
      tokenOut: "USDC",
      amountIn: BigInt(1e18),
      amountOut: BigInt(3200e6),
      priceInUsd: 3200,
      priceOutUsd: 1,
      decimalsIn: 18,
      decimalsOut: 6,
    });
    const formatted = formatEstimate(estimate);
    expect(formatted).toContain("ETH→USDC");
    expect(formatted).toContain("Gas:");
    expect(formatted).toContain("Slippage:");
    expect(formatted).toContain("Net:");
  });
});
