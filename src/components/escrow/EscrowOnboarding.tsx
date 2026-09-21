"use client";

import { useState, useMemo } from "react";
import { formatEther, parseEther } from "viem";
import {
  useAccount,
  useBalance,
  useReadContract,
  useSendTransaction,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";

import { escrowAbi } from "@/lib/abis/escrow";
import { ARBITRUM_SEPOLIA_CHAIN_ID, ESCROW_DEPOSIT_MINIMUM } from "@/lib/constants";
import { isEscrowOwnedByUser } from "@/lib/escrow-security";

interface EscrowOnboardingProps {
  escrowAddress: string;
}

export default function EscrowOnboarding({ escrowAddress }: EscrowOnboardingProps) {
  const { address: userAddress, isConnected } = useAccount();

  // Fail closed before allowing funds into an escrow. Legacy escrows created
  // by the vulnerable factory are owned by the factory contract, not the user.
  const {
    data: escrowOwner,
    isLoading: isOwnerLoading,
    isError: isOwnerError,
  } = useReadContract({
    address: escrowAddress as `0x${string}`,
    abi: escrowAbi,
    functionName: "owner",
    chainId: ARBITRUM_SEPOLIA_CHAIN_ID,
  });
  const isOwnerVerified = isEscrowOwnedByUser(escrowOwner, userAddress);

  // Escrow balance
  const { data: escrowBalance, refetch: refetchEscrowBalance } = useBalance({
    address: escrowAddress as `0x${string}`,
    chainId: ARBITRUM_SEPOLIA_CHAIN_ID,
  });

  // Wallet balance
  const { data: walletBalance } = useBalance({
    address: userAddress,
  });

  // --- Deposit ---
  const [depositAmount, setDepositAmount] = useState("");
  const {
    sendTransaction,
    data: depositTxHash,
    isPending: isDepositing,
  } = useSendTransaction();
  const {
    isLoading: isDepositConfirming,
    isSuccess: isDepositConfirmed,
  } = useWaitForTransactionReceipt({ hash: depositTxHash });

  const parsedDeposit = useMemo(() => {
    if (!depositAmount || isNaN(Number(depositAmount))) return BigInt(0);
    try {
      return parseEther(depositAmount);
    } catch {
      return BigInt(0);
    }
  }, [depositAmount]);

  const isDepositValid =
    isConnected &&
    isOwnerVerified &&
    depositAmount &&
    Number(depositAmount) >= ESCROW_DEPOSIT_MINIMUM &&
    parsedDeposit > BigInt(0);

  const handleDeposit = () => {
    if (!isDepositValid || !escrowAddress || !isOwnerVerified) return;
    sendTransaction({
      to: escrowAddress as `0x${string}`,
      value: parsedDeposit,
      chainId: ARBITRUM_SEPOLIA_CHAIN_ID,
    });
  };

  // --- Withdraw ---
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const {
    writeContract: withdrawWrite,
    data: withdrawTxHash,
    isPending: isWithdrawing,
  } = useWriteContract();
  const {
    isLoading: isWithdrawConfirming,
    isSuccess: isWithdrawConfirmed,
  } = useWaitForTransactionReceipt({ hash: withdrawTxHash });

  const parsedWithdraw = useMemo(() => {
    if (!withdrawAmount || isNaN(Number(withdrawAmount))) return BigInt(0);
    try {
      return parseEther(withdrawAmount);
    } catch {
      return BigInt(0);
    }
  }, [withdrawAmount]);

  const isWithdrawValid =
    isConnected &&
    isOwnerVerified &&
    withdrawAmount &&
    parsedWithdraw > BigInt(0) &&
    escrowBalance &&
    parsedWithdraw <= escrowBalance.value;

  const handleWithdraw = () => {
    if (!isWithdrawValid || !escrowAddress) return;
    withdrawWrite({
      address: escrowAddress as `0x${string}`,
      abi: escrowAbi,
      functionName: "withdraw",
      args: [parsedWithdraw],
      chainId: ARBITRUM_SEPOLIA_CHAIN_ID,
    });
  };

  // Refetch balances after txs
  if (isDepositConfirmed || isWithdrawConfirmed) {
    setTimeout(() => refetchEscrowBalance(), 2000);
  }

  const escrowEth = escrowBalance
    ? Number(formatEther(escrowBalance.value)).toFixed(4)
    : "0.0000";
  const walletEth = walletBalance
    ? Number(formatEther(walletBalance.value)).toFixed(4)
    : "0.0000";

  // Loading state for deposit
  const depositLoading = isDepositing || isDepositConfirming;
  const withdrawLoading = isWithdrawing || isWithdrawConfirming;

  return (
    <div className="space-y-6">
      {/* Escrow Address Display */}
      <div className="rounded-xl border border-gray-700 bg-gray-900 p-5">
        <h3 className="mb-3 text-sm font-semibold text-white">
          Your Escrow Address
        </h3>
        <div className="flex items-center gap-3">
          <code className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-300 break-all">
            {escrowAddress}
          </code>
          <button
            onClick={() => navigator.clipboard.writeText(escrowAddress)}
            className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
            title="Copy address"
          >
            Copy
          </button>
        </div>
        <a
          href={`https://sepolia.arbiscan.io/address/${escrowAddress}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-xs text-emerald-400 hover:underline"
        >
          View on Arbiscan ↗
        </a>
      </div>

      {/* Balance Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-700 bg-gray-900 p-5">
          <p className="text-xs text-gray-500">Escrow Balance</p>
          <p className="mt-1 text-2xl font-bold text-white">
            {escrowEth} ETH
          </p>
          <p className="mt-1 text-xs text-gray-600">Contract-managed escrow</p>
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
      </div>

      {/* Deposit Form */}
      <div className="rounded-xl border border-gray-700 bg-gray-900 p-5">
        <h3 className="mb-4 text-sm font-semibold text-white">Deposit Funds</h3>
        <p className="mb-4 text-sm text-gray-500">
          Deposit ETH to your escrow account to enable automated trading. Your
          funds are secured by a smart contract escrow.
        </p>

        {!isOwnerVerified && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300"
          >
            {isOwnerLoading
              ? "Verifying escrow ownership before deposits are enabled…"
              : isOwnerError
                ? "Could not verify escrow ownership. Deposits are disabled for your protection."
                : "This wallet does not own the escrow contract. Deposits are disabled; migrate to a user-owned escrow before sending funds."}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-xs text-gray-500 mb-1">Amount (ETH)</label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              step="0.01"
              min={ESCROW_DEPOSIT_MINIMUM}
              placeholder="0.00"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              disabled={depositLoading || !isOwnerVerified}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none placeholder:text-gray-600 focus:border-emerald-500/50 disabled:opacity-50"
            />
            <button
              onClick={handleDeposit}
              disabled={!isDepositValid || depositLoading || !isOwnerVerified}
              className="whitespace-nowrap rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {depositLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {isDepositing ? "Confirming..." : "Waiting..."}
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

        {/* Deposit TX Status */}
        {depositTxHash && (
          <TxStatus
            hash={depositTxHash}
            isConfirming={isDepositConfirming}
            isConfirmed={isDepositConfirmed}
            explorerUrl={`https://sepolia.arbiscan.io/tx/${depositTxHash}`}
          />
        )}
      </div>

      {/* Withdraw Form */}
      <div className="rounded-xl border border-gray-700 bg-gray-900 p-5">
        <h3 className="mb-4 text-sm font-semibold text-white">
          Withdraw Funds
        </h3>
        <p className="mb-4 text-sm text-gray-500">
          Withdraw ETH from your escrow account back to your connected wallet.
          Only the escrow owner can withdraw.
        </p>

        <div className="mb-4">
          <label className="block text-xs text-gray-500 mb-1">Amount (ETH)</label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              disabled={withdrawLoading || !isOwnerVerified}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none placeholder:text-gray-600 focus:border-emerald-500/50 disabled:opacity-50"
            />
            <button
              onClick={handleWithdraw}
              disabled={!isWithdrawValid || withdrawLoading || !isOwnerVerified}
              className="whitespace-nowrap rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-400 transition-colors hover:border-emerald-500/60 hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {withdrawLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
                  {isWithdrawing ? "Confirming..." : "Waiting..."}
                </span>
              ) : (
                "Withdraw ETH"
              )}
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-600">
            Available: {escrowEth} ETH
          </p>
        </div>

        {/* Withdraw TX Status */}
        {withdrawTxHash && (
          <TxStatus
            hash={withdrawTxHash}
            isConfirming={isWithdrawConfirming}
            isConfirmed={isWithdrawConfirmed}
            explorerUrl={`https://sepolia.arbiscan.io/tx/${withdrawTxHash}`}
          />
        )}
      </div>
    </div>
  );
}

function TxStatus({
  hash,
  isConfirming,
  isConfirmed,
  explorerUrl,
}: {
  hash: string;
  isConfirming: boolean;
  isConfirmed: boolean;
  explorerUrl: string;
}) {
  return (
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
      </div>
      <div className="mt-2">
        <p className="text-xs text-gray-500">
          TX: <code className="text-gray-300 break-all">{hash}</code>
        </p>
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-block text-xs text-emerald-400 hover:underline"
        >
          View on Arbiscan ↗
        </a>
      </div>
    </div>
  );
}
