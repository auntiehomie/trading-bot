import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import EscrowPage from "@/app/escrow/page";

// Mock wagmi hooks
vi.mock("wagmi", () => ({
  useAccount: vi.fn(),
  useBalance: vi.fn(),
  useSendTransaction: vi.fn(),
  useWaitForTransactionReceipt: vi.fn(),
  useConnect: vi.fn(),
  useDisconnect: vi.fn(),
  useChainId: vi.fn(),
  useConnectors: vi.fn(),
}));

import { useAccount, useBalance } from "wagmi";

const mockUseAccount = useAccount as ReturnType<typeof vi.fn>;
const mockUseBalance = useBalance as ReturnType<typeof vi.fn>;

// Mock the EscrowDeposit component to simplify testing (test EscrowDeposit separately)
vi.mock("@/components/escrow/EscrowDeposit", () => ({
  default: ({ escrowAddress }: { escrowAddress: string }) => (
    <div data-testid="escrow-deposit">
      <span data-testid="deposit-address">{escrowAddress}</span>
      <button>Deposit ETH</button>
    </div>
  ),
}));

describe("Escrow System — Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: wallet disconnected
    mockUseAccount.mockReturnValue({
      address: undefined,
      isConnected: false,
      isDisconnected: true,
    });
    mockUseBalance.mockReturnValue({ data: undefined });
  });

  it("renders escrow page with balance cards when disconnected", () => {
    render(<EscrowPage />);
    expect(screen.getByText("Escrow Balance")).toBeInTheDocument();
    expect(screen.getByText("Wallet Balance")).toBeInTheDocument();
    expect(screen.getByText("Minimum Deposit")).toBeInTheDocument();
  });

  it("shows wallet not connected state", () => {
    render(<EscrowPage />);
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.getByText("Wallet not connected")).toBeInTheDocument();
  });

  it("shows escrow address with copy button", () => {
    render(<EscrowPage />);
    expect(screen.getByText("Escrow Address")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument();
  });

  it("shows minimum deposit amount", () => {
    render(<EscrowPage />);
    expect(screen.getByText("0.01 ETH")).toBeInTheDocument();
    expect(screen.getByText("Minimum required deposit")).toBeInTheDocument();
  });

  it("renders deposit component with escrow address", () => {
    render(<EscrowPage />);
    expect(screen.getByTestId("escrow-deposit")).toBeInTheDocument();
  });

  it("renders withdraw form with disabled button", () => {
    render(<EscrowPage />);
    const withdrawButton = screen.getByRole("button", { name: "Withdraw ETH" });
    expect(withdrawButton).toBeDisabled();
  });

  it("shows wallet balance when connected", () => {
    mockUseAccount.mockReturnValue({
      address: "0x1234567890abcdef1234567890abcdef12345678",
      isConnected: true,
      isDisconnected: false,
    });

    // Return different balances for wallet vs escrow — useBalance is called twice
    mockUseBalance
      .mockReturnValueOnce({ data: { value: BigInt("1500000000000000000"), decimals: 18, symbol: "ETH" } })
      .mockReturnValueOnce({ data: { value: BigInt("450000000000000000"), decimals: 18, symbol: "ETH" } });

    render(<EscrowPage />);
    // Wallet balance card should show 1.5000 ETH
    const ethEntries = screen.getAllByText(/\d+\.\d+ ETH/);
    expect(ethEntries.length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("1.5000 ETH")).toBeInTheDocument();
    expect(screen.getByText("0.4500 ETH")).toBeInTheDocument();
    expect(screen.getByText("Connected wallet")).toBeInTheDocument();
  });

  it("shows escrow balance from contract", () => {
    mockUseBalance
      .mockReturnValueOnce({ data: undefined }) // first call: walletBalance
      .mockReturnValueOnce({ data: { value: BigInt("450000000000000000"), decimals: 18, symbol: "ETH" } }); // second call: escrowBalance
    render(<EscrowPage />);
    expect(screen.getByText("0.4500 ETH")).toBeInTheDocument();
  });

  it("displays escrow info section explaining the flow", () => {
    render(<EscrowPage />);
    expect(screen.getByText("How Escrow Works")).toBeInTheDocument();
    expect(screen.getByText("1. Deposit")).toBeInTheDocument();
    expect(screen.getByText("2. Trade")).toBeInTheDocument();
    expect(screen.getByText("3. Withdraw")).toBeInTheDocument();
  });

  it("shows coming-soon notice for withdrawls", () => {
    render(<EscrowPage />);
    expect(screen.getByText(/withdrawals are coming soon/i)).toBeInTheDocument();
  });
});