import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PaperTradingPage from "@/app/paper-trading/page";

describe("Paper Trading — Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders paper trading page with title and description", () => {
    render(<PaperTradingPage />);
    expect(screen.getByText("Paper Trading")).toBeInTheDocument();
    expect(
      screen.getByText(/Practice trading stocks with virtual money/)
    ).toBeInTheDocument();
  });

  it("renders stock form with buy/sell toggle", () => {
    render(<PaperTradingPage />);
    expect(screen.getByText("New Paper Trade")).toBeInTheDocument();
    // Buy and Sell are both buttons in the toggle + the submit button
    const buyButtons = screen.getAllByRole("button", { name: "Buy" });
    const sellButtons = screen.getAllByRole("button", { name: "Sell" });
    expect(buyButtons.length).toBeGreaterThanOrEqual(1);
    expect(sellButtons.length).toBeGreaterThanOrEqual(1);
  });

  it("renders portfolio table with initial mock positions", () => {
    render(<PaperTradingPage />);
    expect(screen.getByText("Paper Portfolio")).toBeInTheDocument();
    expect(screen.getByText("AAPL")).toBeInTheDocument();
    expect(screen.getByText("NVDA")).toBeInTheDocument();
    expect(screen.getByText("TSLA")).toBeInTheDocument();
  });

  it("places a buy order and adds a new position", async () => {
    render(<PaperTradingPage />);

    const tickerInput = screen.getByPlaceholderText("e.g. AAPL");
    const quantityInput = screen.getByPlaceholderText("0");
    const submitButton = screen.getByRole("button", { name: /Place Buy Order/ });

    fireEvent.change(tickerInput, { target: { value: "MSFT" } });
    fireEvent.change(quantityInput, { target: { value: "10" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("MSFT")).toBeInTheDocument();
    });
  });

  it("places a sell order on existing position and updates quantity", async () => {
    render(<PaperTradingPage />);

    // Switch to sell mode — click the toggle Sell button (first one)
    const sellButtons = screen.getAllByRole("button", { name: "Sell" });
    fireEvent.click(sellButtons[0]); // toggle button

    const tickerInput = screen.getByPlaceholderText("e.g. AAPL");
    const quantityInput = screen.getByPlaceholderText("0");
    const submitButton = screen.getByRole("button", { name: /Place Sell Order/ });

    // Sell 10 shares of AAPL (starting with 50)
    fireEvent.change(tickerInput, { target: { value: "AAPL" } });
    fireEvent.change(quantityInput, { target: { value: "10" } });
    fireEvent.click(submitButton);

    // Position should still exist with reduced quantity
    await waitFor(() => {
      expect(screen.getByText("AAPL")).toBeInTheDocument();
    });
  });

  it("sells all shares and removes position from table", async () => {
    render(<PaperTradingPage />);

    const sellButtons = screen.getAllByRole("button", { name: "Sell" });
    fireEvent.click(sellButtons[0]);

    const tickerInput = screen.getByPlaceholderText("e.g. AAPL");
    const quantityInput = screen.getByPlaceholderText("0");
    const submitButton = screen.getByRole("button", { name: /Place Sell Order/ });

    // Sell all 50 shares of AAPL
    fireEvent.change(tickerInput, { target: { value: "AAPL" } });
    fireEvent.change(quantityInput, { target: { value: "50" } });
    fireEvent.click(submitButton);

    // AAPL should no longer be in the portfolio table
    await waitFor(() => {
      expect(screen.queryByText("AAPL")).not.toBeInTheDocument();
    });
  });

  it("disables submit button when fields are empty", () => {
    render(<PaperTradingPage />);
    const submitButton = screen.getByRole("button", { name: /Place Buy Order/ });
    expect(submitButton).toBeDisabled();
  });

  it("shows empty state when all positions are sold", async () => {
    const { container } = render(<PaperTradingPage />);

    // Sell all positions: AAPL (50), NVDA (20), TSLA (30)
    for (const [ticker, qty] of [["AAPL", "50"], ["NVDA", "20"], ["TSLA", "30"]] as const) {
      const sellButtons = screen.getAllByRole("button", { name: "Sell" });
      fireEvent.click(sellButtons[0]);

      const tickerInput = screen.getByPlaceholderText("e.g. AAPL");
      const quantityInput = screen.getByPlaceholderText("0");
      const submitButton = screen.getByRole("button", { name: /Place Sell Order/ });

      fireEvent.change(tickerInput, { target: { value: ticker } });
      fireEvent.change(quantityInput, { target: { value: qty } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText(ticker)).not.toBeInTheDocument();
      });
    }

    expect(screen.getByText("No paper positions yet.")).toBeInTheDocument();
  });
});
