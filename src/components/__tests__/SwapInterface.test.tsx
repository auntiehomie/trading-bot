import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SwapInterface from "../swap/SwapInterface";

const evaluateTrade = vi.hoisted(() => vi.fn());
vi.mock("@/lib/profitability", () => ({
  DEFAULT_CONFIG: { minProfitUsd: 5, maxSlippageBps: 300, gasPriceGwei: 0.1, ethPriceUsd: 3200, protocolFeeBps: 0, bridgeFeeUsd: 0, gasLimitEstimate: 200000 },
  evaluateTrade,
}));
const subscribe = vi.hoisted(() => vi.fn(() => () => {}));
vi.mock("@/lib/priceMonitor", () => ({
  priceMonitor: { subscribe },
}));

describe("SwapInterface", () => {
  beforeEach(() => {
    cleanup();
    evaluateTrade.mockReset();
    subscribe.mockClear();
  });

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

  it("does not request a quote for an empty or non-positive amount", () => {
    render(<SwapInterface />);
    const amount = screen.getAllByPlaceholderText("0.0")[0];
    fireEvent.change(amount, { target: { value: "0" } });
    fireEvent.click(screen.getByRole("button", { name: "Get Quote" }));
    expect(evaluateTrade).not.toHaveBeenCalled();
    expect(screen.queryByText(/1 ETH =/)).not.toBeInTheDocument();
  });

  it("clears an existing quote when the input or token selection changes", () => {
    evaluateTrade.mockReturnValue({ gasCostUsd: 0.02, slippageBps: 100, netProfitUsd: 1, netProfitPct: 0.1, isProfitable: false });
    render(<SwapInterface />);
    const amount = screen.getAllByPlaceholderText("0.0")[0];
    fireEvent.change(amount, { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: "Get Quote" }));
    expect(screen.getByText(/1 ETH =/)).toBeInTheDocument();

    fireEvent.change(amount, { target: { value: "2" } });
    expect(screen.queryByText(/1 ETH =/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Get Quote" }));
    fireEvent.change(screen.getAllByRole("combobox")[0], { target: { value: "ARB" } });
    expect(screen.queryByText(/ETH =/)).not.toBeInTheDocument();
  });

  it("renders live price updates for the selected token", () => {
    let onUpdate: ((update: { priceUsd: number; source: "websocket" | "poll" | "cache" }) => void) | undefined;
    subscribe.mockImplementation(((
      _token: string,
      listener: (update: { priceUsd: number; source: "websocket" | "poll" | "cache" }) => void,
    ) => {
      onUpdate = listener;
      return () => {};
    }) as never);
    evaluateTrade.mockReturnValue({ gasCostUsd: 0.02, slippageBps: 100, netProfitUsd: 1, netProfitPct: 0.1, isProfitable: false });
    render(<SwapInterface />);
    fireEvent.change(screen.getAllByPlaceholderText("0.0")[0], { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: "Get Quote" }));
    act(() => onUpdate?.({ priceUsd: 3300, source: "poll" }));
    expect(screen.getByText(/Live price: \$3300\.00 \(poll\)/)).toBeInTheDocument();
  });
});
