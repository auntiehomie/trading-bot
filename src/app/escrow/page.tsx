"use client";

import { useAccount, useBalance } from "wagmi";
import { formatEther } from "viem";
import EscrowDeposit from "@/components/escrow/EscrowDeposit";
import { ESCROW_ADDRESS, ESCROW_DEPOSIT_MINIMUM } from "@/lib/constants";

export default function EscrowPage() {
  const { address, isConnected } = useAccount();
  const { data: walletBalance } = useBalance({ address });
  const { data: escrowBalance } = useBalance({
    address: ESCROW_ADDRESS as `0x${string}`,
  });

  const walletEth = walletBalance
    ? Number(formatEther(walletBalance.value)).toFixed(4)
    : "0.0000";
  const escrowEth = escrowBalance
    ? Number(formatEther(escrowBalance.value)).toFixed(4)
    : "0.0000";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Escrow Account</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your escrow deposit used for automated trading.
        </p>
      </div>

      {/* Balance Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-700 bg-gray-900 p-5">
          <p className="text-xs text-gray-500">Escrow Balance</p>
          <p className="mt-1 text-2xl font-bold text-white">
            {escrowEth} ETH
          </p>
          <p className="mt-1 text-xs text-gray-600">
            Contract-managed escrow
          </p>
        </div>
        <div className="rounded-xl border border-gray-700 bg-gray-900 p-5">
          <p className="text-xs text-gray-500">Wallet Balance</p>
          <p className="mt-1 text-2xl font-bold text-white">
            {isConnected ? `${walletEth} ETH` : "—"}
          </p>
          <p className="mt-1 text-xs text-gray-600">
            {isConnected ? "Connected wallet" : "Wallet not connected"}
          </p>
        </div>
        <div className="rounded-xl border border-gray-700 bg-gray-900 p-5">
          <p className="text-xs text-gray-500">Minimum Deposit</p>
          <p className="mt-1 text-2xl font-bold text-white">
            {ESCROW_DEPOSIT_MINIMUM} ETH
          </p>
          <p className="mt-1 text-xs text-gray-600">
            Minimum required deposit
          </p>
        </div>
      </div>

      {/* Escrow Address Display */}
      <div className="rounded-xl border border-gray-700 bg-gray-900 p-5">
        <h3 className="mb-3 text-sm font-semibold text-white">
          Escrow Address
        </h3>
        <div className="flex items-center gap-3">
          <code className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-300 break-all">
            {ESCROW_ADDRESS}
          </code>
          <button
            onClick={() => navigator.clipboard.writeText(ESCROW_ADDRESS)}
            className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
          >
            Copy
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-600">
          Send ETH to this address to fund your escrow account. Only the trading
          agent can execute trades with these funds.
        </p>
      </div>

      {/* Deposit / Withdraw Actions */}
      <div className="grid gap-4 sm:grid-cols-2">
        <EscrowDeposit escrowAddress={ESCROW_ADDRESS} />

        <div className="rounded-xl border border-gray-700 bg-gray-900 p-5">
          <h3 className="mb-4 text-sm font-semibold text-white">
            Withdraw Funds
          </h3>
          <p className="mb-4 text-sm text-gray-500">
            Withdraw ETH from your escrow account back to your connected wallet.
            Withdrawals may have a 24-hour cooldown.
          </p>
          <div className="flex items-center gap-3">
            <input
              type="number"
              placeholder="0.00"
              disabled
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none placeholder:text-gray-600 disabled:opacity-50"
            />
            <button
              disabled
              className="whitespace-nowrap rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm font-semibold text-gray-400 opacity-50 cursor-not-allowed"
            >
              Withdraw ETH
            </button>
          </div>
          <p className="mt-2 text-xs text-amber-400">
            Withdrawals are coming soon — agent signing capability is being built.
          </p>
        </div>
      </div>

      {/* Escrow Info */}
      <div className="rounded-xl border border-gray-700 bg-gray-900 p-5">
        <h3 className="mb-3 text-sm font-semibold text-white">
          How Escrow Works
        </h3>
        <div className="space-y-3 text-sm text-gray-400">
          <p>
            <span className="font-medium text-white">1. Deposit</span> — Send
            ETH to the escrow address. Funds are held securely and only the
            trading agent can execute trades.
          </p>
          <p>
            <span className="font-medium text-white">2. Trade</span> — The
            trading bot uses your escrow balance to execute trades on your
            behalf, never exceeding your deposited amount.
          </p>
          <p>
            <span className="font-medium text-white">3. Withdraw</span> —
            Withdraw unused funds back to your wallet at any time. Coming soon
            with agent-signed withdrawal authorization.
          </p>
        </div>
      </div>
    </div>
  );
}