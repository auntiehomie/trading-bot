# Escrow Smart Contract Deployment Guide

## Overview

This project uses two Solidity contracts deployed on Arbitrun Sepolia:

1. **EscrowFactory.sol** — Deploys user-specific `Escrow` contracts using CREATE2. Every wallet address gets one escrow. Deploy once.
2. **Escrow.sol** — Personal escrow for each user. Holds ETH, allows deposits, withdrawals, and operator-executed trades.

## Prerequisites

- Node.js 18+
- Foundry (recommended) or solc for compilation
- An Arbitrum Sepolia RPC endpoint
- A wallet with sepolia ETH for gas

Get testnet ETH: [https://faucet.quicknode.com/arbitrum/sepolia](https://faucet.quicknode.com/arbitrum/sepolia)

## Compilation

### Option 1: Foundry (Recommended)

```bash
# Install Foundry if not installed
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Install OpenZeppelin dependency
forge install OpenZeppelin/openzeppelin-contracts

# Compile
forge build
```

Then extract the bytecode:

```bash
export ESCROW_FACTORY_BYTECODE=$(cat out/EscrowFactory.sol/EscrowFactory.json | jq -r '.bytecode.object')
```

### Option 2: Using solc (via npm)

```bash
# Install solc
npm install -g solc

# Compile contracts
npx solc --optimize --bin --abi --base-path . \
  --include-path node_modules \
  -o out/ \
  contracts/Escrow.sol contracts/EscrowFactory.sol
```

## Deployment

Set your private key and bytecode, then run the deploy script:

```bash
# Using Foundry bytecode
export PRIVATE_KEY=0xyour_private_key_here
export ESCROW_FACTORY_BYTECODE=$(cat out/EscrowFactory.sol/EscrowFactory.json | jq -r '.bytecode.object')

npx tsx scripts/deploy-factory.ts
```

The script will output:

```
=== Deployment Successful ===
EscrowFactory deployed at: 0x...
```

## Configuration

Add the factory address to `.env.local`:

```bash
NEXT_PUBLIC_ESCROW_FACTORY_ADDRESS=0x1234...  # Replace with deployed address
```

Also ensure you have:

```bash
NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

## Verifying on Arbiscan

### Option 1: Via Foundry

```bash
forge verify-contract \
  --chain 421614 \
  --etherscan-api-key YOUR_ARBISCAN_API_KEY \
  --constructor-args $(cast abi-encode "constructor()") \
  --compiler-version v0.8.24 \
  0xYOUR_FACTORY_ADDRESS \
  contracts/EscrowFactory.sol:EscrowFactory
```

### Option 2: Via Arbiscan UI

1. Go to [https://sepolia.arbiscan.io/](https://sepolia.arbiscan.io/)
2. Search for your factory address
3. Click "Contract" tab → "Verify and Publish"
4. Select:
   - Compiler Type: Solidity (Single File)
   - Compiler Version: v0.8.24+commit.e11b9ed9
   - Open Source License: MIT
   - Optimization: Yes (200 runs)
5. Upload both `Escrow.sol` and `EscrowFactory.sol`
6. Add `@openzeppelin/contracts/access/Ownable.sol` content if asked

## Usage

Once deployed and configured:

1. Start the app: `npm run dev`
2. Connect wallet (MetaMask/Coinbase/WalletConnect) on Arbitrum Sepolia
3. Navigate to `/escrow`
4. Click "Create Escrow Account" — this deploys your personal Escrow contract
5. After creation, deposit ETH to your escrow address
6. Funds can be withdrawn by the escrow owner at any time

## Contract Architecture

```
┌─────────────────────┐
│   EscrowFactory     │  (deployed once)
│   ─────────────     │
│   createEscrow()    │──▶ Deploys new Escrow via CREATE2
│   getEscrow(user)   │──▶ Returns user's escrow address
│   hasEscrow(user)   │──▶ Boolean check
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│   Escrow (per user)  │  (one per wallet)
│   ─────────────────  │
│   receive()         │──▶ Accept ETH deposits
│   withdraw(amount)  │──▶ Owner only
│   trade(token,t,amt) │──▶ OwnerOrOperator
│   setOperator(addr) │──▶ Owner only
│   getBalance()      │──▶ View
└─────────────────────┘
```

## Security Notes

- Each user gets exactly one escrow (CREATE2 with `keccak256(msg.sender)` salt)
- Escrow ownership is assigned to the creator
- An operator can be set to allow a trading bot to execute trades
- Only the owner can withdraw funds
- No upgradeability proxy — each escrow is a standalone contract
- Funds are held in a simple ETH escrow (no token support for deposits, only for trade execution)