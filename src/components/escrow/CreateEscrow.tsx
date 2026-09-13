"use client";

import { escrowFactoryConfig } from "@/lib/contracts";

interface CreateEscrowProps {
  isCreating: boolean;
  isWaitingCreation: boolean;
  isCreationConfirmed: boolean;
  createTxHash: string | undefined;
  onCreateEscrow: () => void;
}

export default function CreateEscrow({
  isCreating,
  isWaitingCreation,
  isCreationConfirmed,
  createTxHash,
  onCreateEscrow,
}: CreateEscrowProps) {
  const isLoading = isCreating || isWaitingCreation;

  return (
    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-6 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
        <span className="text-2xl">🔐</span>
      </div>
      <h2 className="text-lg font-semibold text-emerald-400">
        Create Your Escrow Account
      </h2>
      <p className="mt-2 text-sm text-gray-400">
        Deploy your personal escrow smart contract to securely hold funds for
        automated trading. This is a one-time setup.
      </p>

      {createTxHash ? (
        <div className="mt-4 rounded-lg border border-gray-700 bg-gray-800 p-4 text-left">
          <p className="text-xs text-gray-400">Deployment Status</p>
          <div className="mt-2 space-y-2">
            {/* Pending */}
            <div className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${
                  isCreationConfirmed ? "bg-emerald-400" : "bg-amber-400 animate-pulse"
                }`}
              />
              <span className="text-xs text-gray-300">
                {isCreating
                  ? "Waiting for wallet approval..."
                  : isWaitingCreation
                    ? "Deploying escrow contract..."
                    : isCreationConfirmed
                      ? "Escrow deployed successfully!"
                      : "Unknown state"}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              TX:{" "}
              <code className="text-gray-400 break-all">{createTxHash}</code>
            </p>
            <a
              href={`https://sepolia.arbiscan.io/tx/${createTxHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-xs text-emerald-400 hover:underline"
            >
              View on Arbiscan ↗
            </a>
          </div>
        </div>
      ) : (
        <button
          onClick={onCreateEscrow}
          disabled={isLoading}
          className="mt-4 rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Deploying...
            </span>
          ) : (
            "Create Escrow Account"
          )}
        </button>
      )}

      <p className="mt-3 text-xs text-gray-600">
        Factory: {escrowFactoryConfig.address.slice(0, 6)}...
        {escrowFactoryConfig.address.slice(-4)}
      </p>
    </div>
  );
}