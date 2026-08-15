# TradingHomie 🤖

An AI-powered trading companion — swap tokens, paper trade stocks, and automate strategies on Arbitrum.

> **Status:** Early development scaffold. UI components with mock data. No real blockchain calls or API integrations yet.

## Architecture

```
trading-bot/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── layout.tsx          # Root layout (sidebar + header + wallet)
│   │   ├── page.tsx            # Dashboard (portfolio, positions, activity)
│   │   ├── trade/              # Swap interface (token pairs, quote)
│   │   ├── paper-trading/      # Paper trading (stocks, mock portfolio)
│   │   ├── escrow/             # Escrow account (deposit/withdraw)
│   │   └── settings/           # User preferences and configuration
│   ├── components/
│   │   ├── dashboard/          # PortfolioSummary, OpenPositions, RecentActivity
│   │   ├── layout/             # Sidebar, Header
│   │   ├── swap/               # SwapInterface (token in/out, quote)
│   │   ├── trading/            # StockForm, PortfolioTable
│   │   └── wallet/             # WalletProvider, ConnectButton
│   └── lib/
│       ├── wagmi.ts            # Wagmi v2 + viem config (Arbitrum)
│       ├── constants.ts        # Chain IDs, RPC URLs, config
│       └── mock-data.ts        # Mock portfolio and activity data
├── .github/workflows/
│   ├── ci.yml                  # Build, lint, typecheck on push/PR
│   └── security.yml            # Weekly npm audit + security scan
├── .env.example                # Environment variable template
├── vercel.json                 # Vercel deployment config
└── README.md
```

## Tech Stack

- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (dark theme)
- **Wallet:** Wagmi v2 + Viem + WalletConnect v2
- **Chain:** Arbitrum (chain ID 42161)
- **Deployment:** Vercel

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+

### Installation

```bash
# Clone the repo
git clone git@github.com:auntiehomie/trading-bot.git
cd trading-bot

# Install dependencies
npm install --legacy-peer-deps

# Copy environment variables
cp .env.example .env.local
# Edit .env.local with your WalletConnect project ID and RPC URLs
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | WalletConnect v2 project ID (get from [cloud.walletconnect.com](https://cloud.walletconnect.com)) |
| `NEXT_PUBLIC_ARBITRUM_RPC_URL` | Arbitrum RPC endpoint (defaults to public) |
| `NEXT_PUBLIC_ONEINCH_API_KEY` | 1inch API key for swap routing |
| `JUPITER_API_KEY` | Jupiter API key for Solana routing |

### Development

```bash
npm run dev        # Start dev server at http://localhost:3000
npm run build      # Production build
npm run lint       # Run ESLint
npx tsc --noEmit   # Type check
```

## Features (Planned)

### Phase 1 — Scaffold (Current)
- [x] Next.js App Router + TypeScript + Tailwind
- [x] WalletConnect v2 + Wagmi v2 integration
- [x] Dashboard with mock portfolio data
- [x] Swap interface (UI scaffold)
- [x] Paper trading for tradfi stocks (UI scaffold)
- [x] Escrow account page (UI scaffold)
- [x] Settings page
- [x] CI/CD workflows (build, lint, security)

### Phase 2 — Live Blockchain
- [ ] Real WalletConnect auth flow
- [ ] Live escrow smart contract (basic)
- [ ] Best-course swap routing (1inch, 0x, Paraswap)
- [ ] Real portfolio tracking via on-chain data

### Phase 3 — Automation
- [ ] Automated trading strategies
- [ ] Gnosis Safe multi-sig escrow
- [ ] Multi-EVM support (Robinhood, Solana)
- [ ] Real paper trading via stock APIs (Alpaca, etc.)

## CI/CD

- **CI:** Build, lint, and type check on every push and PR (Node 20 & 22)
- **Security:** Weekly npm audit and security scan (Monday 8:00 UTC, manual trigger available)

## Contributing

This project is under active development. The repository will be renamed to **TradingHomie** at a future milestone.

## License

See [LICENSE](./LICENSE) for details.