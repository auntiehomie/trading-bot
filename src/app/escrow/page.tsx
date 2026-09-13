"use client";

import { useAccount } from "wagmi";
import { useEscrow } from "@/hooks/useEscrow";
import CreateEscrow from "@/components/escrow/CreateEscrow";
import EscrowOnboarding from "@/components/escrow/EscrowOnboarding";

export default function EscrowPage() {
  const { address, isConnected } = useAccount();
  const userAddr = address as `0x${string}` | undefined;

  const {
    escrowAddress,
    hasEscrow,
    isLoading,
    createEscrow,
    isCreating,
    isWaitingCreation,
    isCreationConfirmed,
    createTxHash,
  } = useEscrow(userAddr);

  // Not connected
  if (!isConnected || !address) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Escrow Account</h1>
          <p className="mt-1 text-sm text-gray-500">
            Connect your wallet to create and manage your escrow account.
          </p>
        </div>

        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
            <span className="text-2xl">🔗</span>
          </div>
          <h2 className="text-lg font-semibold text-emerald-400">
            Connect Your Wallet
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Use the connect button in the header to connect your wallet and
            create your escrow account for automated trading on Arbitrum.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
            <span>🟢</span>
            <span>Arbitrum Sepolia</span>
            <span className="ml-4">🔐</span>
            <span>Secure WalletConnect</span>
          </div>
        </div>

        {/* Escrow Info */}
        <div className="rounded-xl border border-gray-700 bg-gray-900 p-5">
          <h3 className="mb-3 text-sm font-semibold text-white">
            How Escrow Works
          </h3>
          <div className="space-y-3 text-sm text-gray-400">
            <p>
              <span className="font-medium text-white">1. Connect</span> —
              Connect your wallet to get started. Your escrow account is
              deployed specifically for your wallet address.
            </p>
            <p>
              <span className="font-medium text-white">2. Create Escrow</span> —
              Deploy your personal escrow smart contract with one click. This is
              a one-time gas fee.
            </p>
            <p>
              <span className="font-medium text-white">3. Deposit</span> — Send
              ETH to your escrow address. Funds are held securely and only you
              or your authorized operator can execute trades.
            </p>
            <p>
              <span className="font-medium text-white">4. Trade</span> — The
              trading bot uses your escrow balance to execute trades on your
              behalf, never exceeding your deposited amount.
            </p>
            <p>
              <span className="font-medium text-white">5. Withdraw</span> —
              Withdraw unused funds back to your wallet at any time.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Loading
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Escrow Account</h1>
          <p className="mt-1 text-sm text-gray-500">Loading your escrow...</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
        </div>
      </div>
    );
  }

  // Connected but no escrow: show create flow
  if (!hasEscrow) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Escrow Account</h1>
          <p className="mt-1 text-sm text-gray-500">
            Set up your escrow account to start automated trading.
          </p>
        </div>

        <CreateEscrow
          isCreating={isCreating}
          isWaitingCreation={isWaitingCreation}
          isCreationConfirmed={isCreationConfirmed}
          createTxHash={createTxHash}
          onCreateEscrow={createEscrow}
        />

        {/* Escrow Info */}
        <div className="rounded-xl border border-gray-700 bg-gray-900 p-5">
          <h3 className="mb-3 text-sm font-semibold text-white">
            How Escrow Works
          </h3>
          <div className="space-y-3 text-sm text-gray-400">
            <p>
              <span className="font-medium text-white">1. Create Escrow</span> —
              Deploy your personal escrow smart contract with one click. This is
              a one-time gas fee.
            </p>
            <p>
              <span className="font-medium text-white">2. Deposit</span> — Send
              ETH to your escrow address. Funds are held securely and only you
              or your authorized operator can execute trades.
            </p>
            <p>
              <span className="font-medium text-white">3. Trade</span> — The
              trading bot uses your escrow balance to execute trades on your
              behalf, never exceeding your deposited amount.
            </p>
            <p>
              <span className="font-medium text-white">4. Withdraw</span> —
              Withdraw unused funds back to your wallet at any time.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Connected with escrow: show full management
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Escrow Account</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your escrow deposit used for automated trading.
        </p>
      </div>

      {escrowAddress && <EscrowOnboarding escrowAddress={escrowAddress} />}

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
            Withdraw unused funds back to your wallet at any time.
          </p>
        </div>
      </div>
    </div>
  );
}