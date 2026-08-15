export interface Position {
  id: string;
  asset: string;
  symbol: string;
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
  type: "spot" | "perpetual";
}

export interface Activity {
  id: string;
  type: "buy" | "sell" | "deposit" | "withdraw";
  asset: string;
  symbol: string;
  amount: number;
  price: number;
  timestamp: string;
  status: "completed" | "pending" | "failed";
}

export interface PaperPosition {
  id: string;
  ticker: string;
  name: string;
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
}

export const mockOpenPositions: Position[] = [
  {
    id: "1",
    asset: "Ethereum",
    symbol: "ETH",
    quantity: 2.5,
    entryPrice: 2850,
    currentPrice: 3240,
    pnl: 975,
    pnlPercent: 13.68,
    type: "spot",
  },
  {
    id: "2",
    asset: "Arbitrum",
    symbol: "ARB",
    quantity: 15000,
    entryPrice: 0.82,
    currentPrice: 0.95,
    pnl: 1950,
    pnlPercent: 15.85,
    type: "spot",
  },
  {
    id: "3",
    asset: "USDC",
    symbol: "USDC",
    quantity: 5000,
    entryPrice: 1.0,
    currentPrice: 1.0,
    pnl: 0,
    pnlPercent: 0,
    type: "spot",
  },
];

export const mockRecentActivity: Activity[] = [
  {
    id: "a1",
    type: "buy",
    asset: "Ethereum",
    symbol: "ETH",
    amount: 1.0,
    price: 2850,
    timestamp: "2026-08-15T14:30:00Z",
    status: "completed",
  },
  {
    id: "a2",
    type: "sell",
    asset: "Arbitrum",
    symbol: "ARB",
    amount: 3000,
    price: 0.93,
    timestamp: "2026-08-15T10:15:00Z",
    status: "completed",
  },
  {
    id: "a3",
    type: "deposit",
    asset: "USDC",
    symbol: "USDC",
    amount: 2000,
    price: 1.0,
    timestamp: "2026-08-14T09:00:00Z",
    status: "completed",
  },
  {
    id: "a4",
    type: "buy",
    asset: "Chainlink",
    symbol: "LINK",
    amount: 100,
    price: 14.2,
    timestamp: "2026-08-14T08:45:00Z",
    status: "pending",
  },
];

export const mockPaperPortfolio: PaperPosition[] = [
  {
    id: "p1",
    ticker: "AAPL",
    name: "Apple Inc.",
    quantity: 50,
    entryPrice: 185.0,
    currentPrice: 195.3,
    pnl: 515,
    pnlPercent: 5.57,
  },
  {
    id: "p2",
    ticker: "NVDA",
    name: "NVIDIA Corporation",
    quantity: 20,
    entryPrice: 850.0,
    currentPrice: 920.5,
    pnl: 1410,
    pnlPercent: 8.29,
  },
  {
    id: "p3",
    ticker: "TSLA",
    name: "Tesla Inc.",
    quantity: 30,
    entryPrice: 245.0,
    currentPrice: 232.8,
    pnl: -366,
    pnlPercent: -4.98,
  },
];

export const mockPortfolioSummary = {
  totalValue: 45600,
  totalPnl: 2975,
  totalPnlPercent: 6.98,
  escrowBalance: 0.45,
  buyingPower: 12500,
};