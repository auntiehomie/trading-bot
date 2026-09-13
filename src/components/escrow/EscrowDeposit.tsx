"use client";

import { useState, useMemo } from "react";
import { useAccount, useSendTransaction, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, formatEther } from "viem";
import { arbitrum } from "@wagmi/core/chains";
import { ESCROW_DEPOSIT_MINIMUM } from "@/lib/constants";

interface EscrowDepositProps {
  escrowAddress: string;
}

export default function EscrowDeposit({ escrowAddress }: EscrowDepositProps) {
  const { address, isConnected } = useAccount();
  const [amount, setAmount] = useState("");
  const [txError, setTxError] = useState<string | null>(null);

  const {
    sendTransaction,
    data: txHash,
    isPending: isSending,
    error: sendError,
  } = useSendTransaction();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const parsedAmount = useMemo(() => {
    if (!amount || isNaN(Number(amount))) return BigInt(0);
    try {
      return parseEther(amount);
    } catch {
      return BigInt(0);
    }
  }, [amount]);

  const isValid =
    isConnected &&
    amount &&
    Number(amount) >= ESCROW_DEPOSIT_MINIMUM &&
    parsedAmount > BigInt(0);

  const handleDeposit = async () => {
    if (!isValid) return;
    setTxError(null);
    try {
      sendTransaction({
        to: escrowAddress as `0x${string}`,
        value: parsedAmount,
      });
    } catch (e) {
      setTxError(e instanceof Error ? e.message : "Transaction failed");
    }
  };

  const resolvedError =
    txError || sendError?.message || receiptError?.message || null;

  if (!isConnected || !address) {
    return (
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-6 text-center">
        <p className="text-amber-400 font-semibold">
          Connect your wallet first
        </p>
        <p className="mt-1 text-sm text-gray-500">
          Use the connect button in the header to connect your wallet before
          making a deposit.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-700 bg-gray-900 p-5">
      <h3 className="mb-4 text-sm font-semibold text-white">Deposit Funds</h3>
      <p className="mb-4 text-sm text-gray-500">
        Deposit ETH to your escrow account to enable automated trading. Your
        funds are secured by a smart contract escrow.
      </p>

      {/* Escrow Address Display */}
      <div className="mb-4 rounded-lg border border-gray-700 bg-gray-800 p-3">
        <p className="text-xs text-gray-500">Escrow Address</p>
        <div className="mt-1 flex items-center justify-between gap-2">
          <code className="text-xs text-gray-300 truncate">
            {escrowAddress}
          </code>
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(escrowAddress)}
            className="shrink-0 rounded bg-gray-700 px-2 py-1 text-xs text-gray-400 hover:bg-gray-600 hover:text-white transition-colors"
          >
            Copy
          </button>
        </div>
      </div>

      {/* Amount Input */}
      <div className="mb-4">
        <label className="block text-xs text-gray-500 mb-1">
          Amount (ETH)
        </label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            step="0.01"
            min={ESCROW_DEPOSIT_MINIMUM}
            placeholder="0.00"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setTxError(null);
            }}
            disabled={isSending || isConfirming}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none placeholder:text-gray-600 focus:border-emerald-500/50 disabled:opacity-50"
          />
          <button
            onClick={handleDeposit}
            disabled={!isValid || isSending || isConfirming}
            className="whitespace-nowrap rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSending || isConfirming ? (
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                {isSending ? "Confirming..." : "Waiting..."}
              </span>
            ) : (
              "Deposit ETH"
            )}
          </button>
        </div>

        <p className="mt-1 text-xs text-gray-600">
          Minimum deposit: {ESCROW_DEPOSIT_MINIMUM} ETH
        </p>
      </div>

      {/* Transaction Status */}
      {txHash && (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
          <p className="text-xs text-gray-500">Transaction Status</p>
          <div className="mt-2 flex items-center gap-2">
            {isConfirming && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-400">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                Confirming...
              </span>
            )}
            {isConfirmed && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Confirmed
              </span>
            )}
            {resolvedError && !isConfirmed && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-400">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                Failed
              </span>
            )}
          </div>
          <div className="mt-2">
            <p className="text-xs text-gray-500">
              TX:{" "}
              <code className="text-gray-300 break-all">{txHash}</code>
            </p>
            <a
              href={`https://arbiscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-xs text-emerald-400 hover:underline"
            >
              View on Arbiscan ↗
            </a>
          </div>
        </div>
      )}

      {/* Error Display */}
      {resolvedError && !txHash && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
          <p className="text-xs text-red-400">{resolvedError}</p>
        </div>
      )}
    </div>
  );
}