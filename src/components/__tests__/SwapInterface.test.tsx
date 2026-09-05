import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SwapInterface from "../swap/SwapInterface";

const evaluateTrade = vi.hoisted(() => vi.fn());
vi.mock("@/lib/profitability", () => ({
  DEFAULT_CONFIG: { minProfitUsd: 5, maxSlippageBps: 300, gasPriceGwei: 0.1, ethPriceUsd: 3200, protocolFeeBps: 0, bridgeFeeUsd: 0, gasLimitEstimate: 200000 },
  evaluateTrade,
}));
vi.mock("@/lib/priceMonitor", () => ({
  priceMonitor: { subscribe: vi.fn(() => () => {}) },
}));

describe("SwapInterface", () => {
  beforeEach(() => { cleanup(); evaluateTrade.mockReset(); });

  it("renders token inputs and actions", () => {
    render(<SwapInterface />);
    expect(screen.getByText("Swap Tokens")).toBeInTheDocument();
    expect(screen.getAllByPlaceholderText("0.0")[0]).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Get Quote" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Execute Swap" })).toBeDisabled();
  });

  it("accepts an amount and displays a quote and profitability", () => {
    evaluateTrade.mockReturnValue({ gasCostUsd: 0.02, slippageBps: 300, netProfitUsd: 12.5, netProfitPct: 1.2, isProfitable: true });
    render(<SwapInterface />);
    const input = screen.getAllByPlaceholderText("0.0")[0];
    fireEvent.change(input, { target: { value: "10" } });
    fireEvent.click(screen.getByRole("button", { name: "Get Quote" }));
    expect(screen.getByText(/1 ETH = 3215.5000 USDC/)).toBeInTheDocument();
    expect(screen.getByText(/\+\$12.50/)).toBeInTheDocument();
    expect(screen.getByText("✓ PROFITABLE")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Execute Swap" })).toBeEnabled();
  });

  it("swaps token direction and clears the quote", () => {
    render(<SwapInterface />);
    fireEvent.change(screen.getAllByPlaceholderText("0.0")[0], { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: "Get Quote" }));
    fireEvent.click(screen.getByRole("button", { name: "↓↑" }));
    expect(screen.getAllByRole("combobox")[0]).toHaveValue("USDC");
    expect(screen.queryByText(/1 ETH =/)).not.toBeInTheDocument();
  });

  it("keeps execution disabled when the estimate is unprofitable", () => {
    evaluateTrade.mockReturnValue({ gasCostUsd: 0.02, slippageBps: 300, netProfitUsd: -2, netProfitPct: -1, isProfitable: false });
    render(<SwapInterface />);
    fireEvent.change(screen.getAllByPlaceholderText("0.0")[0], { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: "Get Quote" }));
    expect(screen.getByText("⚠ LOW PROFIT")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Execute Swap" })).toBeDisabled();
  });
});
