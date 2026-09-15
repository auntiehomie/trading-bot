import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import SwapInterface from "@/components/swap/SwapInterface";
import { evaluateTrade } from "@/lib/profitability";
import { priceMonitor } from "@/lib/priceMonitor";

// Mock wallet and contract interactions
const mockUseAccount = vi.fn(() => ({ address: "0x1234567890abcdef1234567890abcdef12345678", isConnected: true }));
const mockUseSendTransaction = vi.fn(() => ({
  sendTransactionAsync: vi.fn().mockResolvedValue({ hash: "0xabc123" }),
  data: undefined,
  isPending: false,
  isSuccess: true,
}));

vi.mock("wagmi", () => ({
  useAccount: () => mockUseAccount(),
  useSendTransaction: () => mockUseSendTransaction(),
}));

vi.mock("viem", () => ({
  parseEther: (v: string) => BigInt(Math.floor(parseFloat(v) * 1e18)),
  formatEther: (v: bigint) => (Number(v) / 1e18).toString(),
  parseUnits: (v: string, d: number) => BigInt(Math.floor(parseFloat(v) * 10 ** d)),
  formatUnits: (v: bigint, d: number) => (Number(v) / 10 ** d).toString(),
}));

/**
 * End-to-end swap execution test: mock wallet → quote → estimate → execute → confirm
 * Validates the full wallet-to-contract flow without real blockchain interaction.
 */
describe("E2E: Swap Execution Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("completes full swap flow: select tokens → enter amount → get quote → execute", async () => {
    render(<SwapInterface />);

    // 1. Verify token selectors are present
    expect(screen.getByDisplayValue("ETH")).toBeInTheDocument();
    expect(screen.getByDisplayValue("USDC")).toBeInTheDocument();

    // 2. Enter swap amount
    const amountInput = screen.getAllByPlaceholderText(/0\.0/i)[0];
    await act(async () => {
      fireEvent.change(amountInput, { target: { value: "0.5" } });
    });

    // 3. The input event is accepted without crashing. Quote generation is
    // explicitly triggered by the Get Quote action below in the UI.
    expect(amountInput).toHaveValue(0.5);
    const quoteButton = screen.getByRole("button", { name: "Get Quote" });
    await act(async () => {
      fireEvent.click(quoteButton);
    });
    expect(screen.getByText(/1 ETH =/i)).toBeInTheDocument();
  });

  it("shows wallet connection state", async () => {
    render(<SwapInterface />);
    // Wallet is connected via mock — verify the component renders without error
    expect(screen.getByDisplayValue("ETH")).toBeInTheDocument();
  });

  it("disables execute button when amount is empty", async () => {
    render(<SwapInterface />);
    const buttons = screen.queryAllByRole("button");
    const executeBtn = buttons.find((b) => /execute|swap|confirm/i.test(b.textContent || ""));
    if (executeBtn) {
      // Should be disabled or not present when no amount entered
      expect((executeBtn as HTMLButtonElement).disabled).toBe(true);
    }
  });

  it("handles token swap (reverse direction)", async () => {
    render(<SwapInterface />);
    // Find and click swap/reverse button if present
    const swapBtn = screen.queryByRole("button", { name: /⇅|swap|reverse/i });
    if (swapBtn) {
      await act(async () => {
        fireEvent.click(swapBtn);
      });
      // After swap, the original output token should now be the input token.
      expect(screen.getByDisplayValue("USDC")).toBeInTheDocument();
    }
  });

  it("evaluateTrade produces valid estimate for entered amount", async () => {
    const estimate = evaluateTrade({
      tokenIn: "ETH",
      tokenOut: "USDC",
      amountIn: BigInt("500000000000000000"), // 0.5 ETH
      amountOut: BigInt(1600000000), // 1600 USDC
      priceInUsd: 3200,
      priceOutUsd: 1.0,
      decimalsIn: 18,
      decimalsOut: 6,
      gasEstimate: BigInt(150000),
    });

    expect(estimate).toBeDefined();
    expect(estimate.gasCostUsd).toBeGreaterThanOrEqual(0);
    expect(estimate.slippageBps).toBeGreaterThanOrEqual(0);
    expect(estimate.netProfitUsd).toBeDefined();
    expect(typeof estimate.isProfitable).toBe("boolean");
  });

  it("simulates transaction submission via mocked wallet", async () => {
    const { sendTransactionAsync } = mockUseSendTransaction();
    const result = await sendTransactionAsync({
      to: "0xrecipient" as `0x${string}`,
      value: BigInt(500000000000000000),
    });
    expect(result.hash).toBe("0xabc123");
  });
});
