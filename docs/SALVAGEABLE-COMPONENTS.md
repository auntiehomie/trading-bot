# Salvageable Components from Archived Projects

> Compiled 2026-08-21 during backlog processing.
> This is a research deliverable for Trading Bot Next items:
> "Read through backlogs of archived projects to identify salvageable components"
> "Determine best approach for building the trading bot"

## Summary

Three archived repos (Liquidation Bot, Solana Arb Bot, Meteora LP Bot) contain
substantial battle-tested components that should inform the Trading Bot architecture.
All three repos have been deleted from GitHub but their patterns, tests, and designs
are documented in `rufus-vault/backlogs/`.

---

## Liquidation Bot — Salvageable Patterns

**Repo:** auntiehomie/liquidation-bot (deleted)
**Key assets:** 135 unit tests, CI workflow, alerting infrastructure

### 1. Testing Culture (HIGH PRIORITY)
- 135 unit tests across `liquidate.unit.test.ts`, `monitor.unit.test.ts`, `profitability.unit.test.ts`, `recursiveLeverage.unit.test.ts`
- CI workflow with build, lint, dependency audit, and test steps
- **Carry forward:** Set up ≥80% coverage gate from day one in Trading Bot

### 2. Alerting Infrastructure (HIGH PRIORITY)
- Discord webhook + Telegram bot dual-channel alerts
- Structured payloads: liquidation success/failure, gas spike, P&L summary, crash alerts
- Hourly P&L summary to both channels
- **Carry forward:** `src/lib/alerts.ts` pattern with Discord webhook + optional Telegram

### 3. Flash Loan Execution Pattern
- Balancer V2 flash loans (0% fee on Arbitrum)
- Atomic: flash borrow → liquidate → 1inch swap → repay → profit stays
- Dry-run mode (`DRY_RUN=true`) for simulation without spending gas
- **Carry forward:** Flash loan abstraction for any DeFi operation needing capital efficiency

### 4. Gas Management
- Dynamic gas pricing with EIP-1559
- Real-time gas monitoring, adaptive bidding
- `maxFeePerGas`/`maxPriorityFeePerGas` ceilings
- Gas spike alerting
- **Carry forward:** `src/lib/gas.ts` with base fee monitoring + adaptive bidding

### 5. Health Factor Monitoring
- Multi-tier: Green (>1.2 log only), Yellow (1.0-1.2 pre-simulate), Red (<1.0 execute), Critical (<0.95 bypass check)
- Redundant architecture (The Graph + direct polling)
- **Carry forward:** Tiered monitoring pattern for any position-based trading

### 6. Operational Tooling
- Wallet balance monitoring (alerts when <0.01 ETH)
- Environment variable validation script
- P&L summary dashboard (reads JSONL, terminal output, `--last Nh/Nd` flags)
- Rate limiting + exponential backoff for RPC calls
- **Carry forward:** All operational tooling patterns

### 7. CI/CD
- GitHub Actions workflow: build + test on Node 20/22, lint, dependency audit
- CI badge in README
- **Carry forward:** Full CI pipeline from day one

---

## Solana Arb Bot — Salvageable Patterns

**Repo:** auntiehomie/solana-arb-bot (deleted)
**Key assets:** Jito bundle submission, multi-relay, JSONL logging, P&L aggregator

### 1. MEV Bundle Submission (HIGH PRIORITY)
- Jito bundle submission for atomic execution
- Multi-relay fanout: Jito US, Amsterdam, Frankfurt, Tokyo
- Dynamic tip calibration (50-60% of expected profit)
- Pre-flight simulation (`simulateTransaction`) before every tipped opportunity
- **Carry forward:** Bundle submission abstraction for multi-chain MEV

### 2. Structured Logging (HIGH PRIORITY)
- JSONL trade logging: `logTradeAttempt()`, `logTradeAttemptStart()`, `logTradeResult()`
- P&L aggregator from JSONL logs: `--days N`, `--since YYYY-MM-DD`, `--json`
- Daily P&L report cron job
- **Carry forward:** `src/lib/jsonl-logger.ts` + `scripts/pnl-aggregator.ts` patterns

### 3. Fee Modeling
- Fee estimation per trade: `estimateFees()`, `calcNetProfit()`, `feeFloorPct()`
- 15 unit tests for fee calculations
- Benchmark script for different trade sizes
- **Carry forward:** `src/lib/fees.ts` with comprehensive fee modeling

### 4. Monitoring Stack
- Prometheus + Grafana + Loki
- 8 key metrics: opportunity latency, bundle win rate, profit per venue, Jito tip %
- **Carry forward:** Observability architecture; may start simpler with Sentry + structured logs

### 5. DEX Coverage
- Jupiter self-hosted aggregator (30+ venue coverage)
- Used as quote oracle (not runtime dependency)
- USDT and mSOL token pair coverage
- **Carry forward:** Aggregator-as-oracle pattern for best-price routing

### 6. Telegram Bot Interface
- View P&L, running status, recent trades
- Adjust parameters (minProfitPct, maxSlippage) via Telegram commands
- Bonkbok/Trojan model ($1B+ cumulative bot revenue on Solana)
- **Carry forward:** Telegram control interface for bot management

---

## Meteora LP Bot — Salvageable Patterns

**Repo:** auntiehomie/Meteora-LP-Bot (deleted)
**Key assets:** DLMM rebalancing, auto-compounding, multi-strategy

### 1. Auto-Compounding
- Claim fees and redeploy into existing LP position
- Batch compounds when accumulated fees exceed gas cost threshold
- Kamino vault pattern ($2.4B+ TVL proven)
- **Carry forward:** Auto-compounding strategy for yield-generating positions

### 2. Multi-Strategy Support
- Stable pair (tight range 2-5 bins)
- Volatility farm (wider range, higher risk)
- Trend following, Mean reversion, Custom
- **Carry forward:** Strategy abstraction layer for user-selectable strategies

### 3. Risk Management
- Impermanent loss alerts (Telegram/Discord)
- Maximum position size caps
- Stop-loss/range-exit
- Gas spike circuit breakers
- **Carry forward:** Risk guardrail system

### 4. Performance Tracking
- P&L dashboard per position and overall
- Realized vs projected APR/APY
- On-chain verifiable performance (wallet on Solscan/Birdeye)
- High-water mark performance fee model (10-20% of profits)
- **Carry forward:** P&L tracking + performance fee architecture

### 5. Backtesting Engine
- Simulate strategy against historical pool data
- Validate parameters before deploying live
- **Carry forward:** Backtesting framework for strategy validation

---

## Recommended Architecture for Trading Bot

Based on the salvageable components, the Trading Bot should be built as:

### Phase 1 — Foundation (NOW)
1. **Testing + CI** from Liquidation Bot (≥80% coverage gate, CI workflow)
2. **Structured logging** from Solana Arb Bot (JSONL logger + P&L aggregator)
3. **Alerting** from Liquidation Bot (Discord webhook + structured alerts)
4. **Next.js scaffold** — already done on main branch

### Phase 2 — Core Features (NEXT)
5. **Swap execution** from Solana patterns (aggregator-as-oracle, pre-flight sim)
6. **Escrow system** — contract already written on `feat/wire-real-apis` branch
7. **Paper trading** — Alpaca integration already wired on `feat/wire-real-apis` branch
8. **WalletConnect** — already integrated on `feat/wire-real-apis` branch

### Phase 3 — Advanced (LATER)
9. **Multi-strategy** from Meteora (strategy abstraction, user-selectable)
10. **Auto-compounding** from Meteora (yield redeployment)
11. **MEV bundles** from Solana (Jito bundle submission)
12. **Flash loans** from Liquidation Bot (capital efficiency)

### Immediate Action
- Merge `feat/wire-real-apis` into `main` — it has 1,178 lines of working code
  (WalletConnect, 1inch swaps, Alpaca paper trading, escrow contract)
- Set up CI with test coverage gate
- Add JSONL logging infrastructure