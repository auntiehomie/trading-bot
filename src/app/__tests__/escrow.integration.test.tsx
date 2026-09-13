import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import EscrowPage from "@/app/escrow/page";

describe("Escrow System — Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders escrow page with balance card", () => {
    render(<EscrowPage />);
    expect(screen.getByText("Escrow Balance")).toBeInTheDocument();
    expect(screen.getByText("0.45 ETH")).toBeInTheDocument();
  });

  it("shows minimum deposit and pending withdrawals", () => {
    render(<EscrowPage />);
    expect(screen.getByText("Minimum Deposit")).toBeInTheDocument();
    expect(screen.getByText("0.01 ETH")).toBeInTheDocument();
    expect(screen.getByText("Pending Withdrawals")).toBeInTheDocument();
    expect(screen.getByText("No pending withdrawals")).toBeInTheDocument();
  });

  it("renders deposit form with disabled button", () => {
    render(<EscrowPage />);
    const depositButton = screen.getByRole("button", { name: "Deposit ETH" });
    expect(depositButton).toBeDisabled();
  });

  it("renders withdraw form with disabled button", () => {
    render(<EscrowPage />);
    const withdrawButton = screen.getByRole("button", { name: "Withdraw ETH" });
    expect(withdrawButton).toBeDisabled();
  });

  it("displays escrow info section explaining the flow", () => {
    render(<EscrowPage />);
    expect(screen.getByText("How Escrow Works")).toBeInTheDocument();
    expect(screen.getByText("1. Deposit")).toBeInTheDocument();
    expect(screen.getByText("2. Trade")).toBeInTheDocument();
    expect(screen.getByText("3. Withdraw")).toBeInTheDocument();
  });

  it("shows deposit input field", () => {
    render(<EscrowPage />);
    const inputs = screen.getAllByPlaceholderText("0.00");
    expect(inputs).toHaveLength(2); // deposit + withdraw
  });

  it("displays not-yet-active notices for both forms", () => {
    render(<EscrowPage />);
    expect(screen.getByText(/Deposits are not yet active/)).toBeInTheDocument();
    expect(
      screen.getByText(/Withdrawals are not yet active/)
    ).toBeInTheDocument();
  });
});
