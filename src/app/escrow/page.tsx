"use client";

export default function EscrowPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Escrow Account</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your escrow deposit used for automated trading.
        </p>
      </div>

      {/* Balance Card */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-700 bg-gray-900 p-5">
          <p className="text-xs text-gray-500">Escrow Balance</p>
          <p className="mt-1 text-2xl font-bold text-white">0.45 ETH</p>
          <p className="mt-1 text-xs text-gray-600">≈ $1,462.95 USD</p>
        </div>
        <div className="rounded-xl border border-gray-700 bg-gray-900 p-5">
          <p className="text-xs text-gray-500">Minimum Deposit</p>
          <p className="mt-1 text-2xl font-bold text-white">0.01 ETH</p>
          <p className="mt-1 text-xs text-gray-600">≈ $32.51 USD</p>
        </div>
        <div className="rounded-xl border border-gray-700 bg-gray-900 p-5">
          <p className="text-xs text-gray-500">Pending Withdrawals</p>
          <p className="mt-1 text-2xl font-bold text-white">0.00 ETH</p>
          <p className="mt-1 text-xs text-gray-600">No pending withdrawals</p>
        </div>
      </div>

      {/* Deposit / Withdraw Actions */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-700 bg-gray-900 p-5">
          <h3 className="mb-4 text-sm font-semibold text-white">
            Deposit Funds
          </h3>
          <p className="mb-4 text-sm text-gray-500">
            Deposit ETH to your escrow account to enable automated trading. Your
            funds are secured by a smart contract escrow.
          </p>
          <div className="flex items-center gap-3">
            <input
              type="number"
              placeholder="0.00"
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none placeholder:text-gray-600 focus:border-emerald-500/50"
            />
            <button
              disabled
              className="whitespace-nowrap rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white opacity-50 cursor-not-allowed"
            >
              Deposit ETH
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-600">
            Deposits are not yet active — UI scaffold only.
          </p>
        </div>

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
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none placeholder:text-gray-600 focus:border-emerald-500/50"
            />
            <button
              disabled
              className="whitespace-nowrap rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm font-semibold text-gray-400 opacity-50 cursor-not-allowed"
            >
              Withdraw ETH
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-600">
            Withdrawals are not yet active — UI scaffold only.
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
            ETH to your personal escrow smart contract. Funds remain under your
            control.
          </p>
          <p>
            <span className="font-medium text-white">2. Trade</span> — The
            trading bot uses your escrow balance to execute trades on your
            behalf, never exceeding your deposited amount.
          </p>
          <p>
            <span className="font-medium text-white">3. Withdraw</span> —
            Withdraw unused funds back to your wallet at any time. Future plans
            include Gnosis Safe integration for shared escrow accounts.
          </p>
        </div>
      </div>
    </div>
  );
}