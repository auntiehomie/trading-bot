# DeFi liquidation, arbitrage, and trading best practices

**Research date:** 2026-09-09  
**Scope:** operational guidance for a non-custodial, EVM-focused bot. This is engineering research, not financial advice. Protocol parameters and chain conditions change; verify against the deployed protocol version before execution.

## Executive summary

A profitable opportunity is not the same as an executable opportunity. Every candidate should pass a pre-trade simulation and a conservative net-profit check that includes gas, protocol fees, DEX fees, price impact, slippage, failed-transaction risk, capital costs, and the probability of adverse ordering. Keep discovery, simulation, signing, submission, and post-trade reconciliation separate so a stale quote cannot silently become an on-chain loss.

## Liquidation

- Discover positions from protocol state/indexers, but re-read the account, oracle prices, health factor, debt, and collateral immediately before submission. A health factor below 1 is a necessary condition, not a guarantee that the transaction will remain liquidatable when mined.
- Select debt and collateral deliberately. Prefer liquid collateral with reliable exit liquidity and a liquidation bonus that exceeds **all** costs. Aave's current liquidation guide explicitly recommends checking that bonus exceeds gas and notes that only collateral-enabled supplies are eligible; protocol-specific rules (including close factors, minimum residual debt, and bonus mechanics) must be read from the deployed version.
- Use the protocol's canonical oracle and validate freshness, round completeness, decimals, and chain/network identity. On L2s, check the sequencer-uptime feed and apply the documented grace period after recovery before trusting prices.
- Simulate the exact liquidation call against the latest state. Bound the repayment amount, collateral received, recipient, deadline, and minimum output. Avoid assuming that a quoted bonus is guaranteed during volatile markets.
- Maintain enough inventory of the debt asset (or a tested flash-liquidity path) and account for approval/permit, callback, and repayment failure modes. Use atomic transactions where appropriate, but do not treat flash liquidity as risk-free.
- Protect execution with access control, pausability, reentrancy defenses, safe token handling, checked arithmetic, and explicit chain/domain checks. Emit events and reconcile seized collateral and realized P&L after confirmation.

## Arbitrage

- Compare executable routes, not ticker prices: normalize token decimals, pool fees, price impact, gas, bridge costs, and settlement latency. Search across venues and fee tiers, then quote again immediately before execution.
- Require a safety margin above estimated net profit. Stress the calculation for gas spikes, partial fills, fee-on-transfer tokens, stale reserves, and adverse price movement. Reject negative or too-thin trades rather than increasing gas blindly.
- Prefer atomic same-chain paths when possible. Cross-chain arbitrage adds bridge credit, finality, reorg, and inventory risks; model it as a separate strategy with explicit exposure limits.
- Use private order flow / MEV-aware submission where suitable. Public mempools expose profitable transactions to frontrunners and sandwichers; private relays can reduce that risk but introduce inclusion, censorship, privacy, and builder trust considerations. Monitor inclusion and have a bounded fallback policy—never duplicate-submit without nonce/idempotency controls.
- Simulate with the exact calldata and current block state. Set deadlines, minimum outputs, and route constraints. Treat failed transactions, reverts, RPC disagreement, and reorgs as first-class outcomes and alert on them.
- Keep nonce management serialized per signer, cap concurrency, rotate RPC endpoints carefully, and maintain circuit breakers for abnormal slippage, oracle divergence, gas, latency, or failure rate.

## Trading patterns and strategy engineering

- Start with a precise hypothesis (momentum, mean reversion, market making, liquidation, or arbitrage), a defined holding period, and invalidation criteria. Separate signal generation from execution and risk controls.
- Backtest with historical order-book/pool state and realistic costs. Include fees, gas, bid/ask spread, price impact, latency, partial fills, funding/borrow costs, failed orders, and adversarial selection. Use walk-forward or out-of-sample validation; avoid look-ahead bias, survivorship bias, and parameter overfitting.
- Paper trade and shadow production before funding. Compare expected versus realized slippage, fill rate, latency, and P&L. Roll out capital gradually with per-trade, per-asset, daily-loss, and inventory limits.
- Size positions from measured risk, not confidence. Keep correlated exposure bounded, reserve gas and repayment liquidity, and define hard stops plus a global kill switch. A stop is not guaranteed in a thin or halted market; model gaps and liquidation risk.
- Record every decision input, quote, simulation result, transaction hash, receipt, and realized outcome. Use deterministic IDs/idempotency keys so retries cannot create duplicate exposure. Reconcile balances and approvals continuously.
- Monitor oracle freshness, pool liquidity, gas, RPC health, chain reorgs, nonce gaps, revert reasons, and strategy drift. Alert before limits are breached and pause automatically on data-quality or execution anomalies.

## Suggested pre-trade checklist

1. Correct chain, contract addresses, token decimals, and signer.
2. Fresh independent price/reserve data; oracle and sequencer checks pass.
3. Exact transaction simulated successfully against current state.
4. Net profit remains positive under conservative gas/slippage/latency assumptions.
5. Minimum outputs, deadline, recipient, repayment, and nonce policy are bounded.
6. MEV/order-flow choice is intentional; retry behavior is idempotent.
7. Position, inventory, daily loss, and failure-rate limits permit the trade.
8. Post-trade receipt and balance reconciliation are scheduled.

## Sources

- Aave, **Liquidations** (Aave v4 developer documentation): https://aave.com/docs/aave-v4/positions/liquidations (accessed 2026-09-09). Covers health factor eligibility, debt/collateral selection, gas-versus-bonus economics, and protocol-specific liquidation mechanics.
- Chainlink, **Using Data Feeds on EVM Chains**: https://docs.chain.link/data-feeds/using-data-feeds (accessed 2026-09-09). Covers feed selection, `latestRoundData`, and the warning to check L2 sequencer uptime when consuming prices on L2.
- Flashbots, **MEV Protection Overview**: https://docs.flashbots.net/flashbots-protect/overview (accessed 2026-09-09). Describes private transaction routing, frontrunning/sandwich protection, inclusion behavior, and configurable privacy/speed/refunds.
- OpenZeppelin, **Contracts 5.x Utilities**: https://docs.openzeppelin.com/contracts/5.x/api/utils (accessed 2026-09-09). Reference for `ReentrancyGuard`, `Pausable`, `SafeCast`, and related defensive building blocks.

Re-check all links and deployed contract documentation during implementation; this document intentionally does not prescribe protocol addresses or immutable parameter values.
