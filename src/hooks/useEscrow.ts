"use client";

import { useMemo, useEffect } from "react";
import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { escrowFactoryConfig } from "@/lib/contracts";

export function useEscrow(userAddress: `0x${string}` | undefined) {
  // 1. Check if user has an escrow
  const {
    data: hasEscrow,
    isLoading: hasEscrowLoading,
    refetch: refetchHasEscrow,
  } = useReadContract({
    ...escrowFactoryConfig,
    functionName: "hasEscrow",
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: !!userAddress },
  });

  // 2. Get escrow address
  const {
    data: escrowAddress,
    isLoading: escrowLoading,
    refetch: refetchEscrow,
  } = useReadContract({
    ...escrowFactoryConfig,
    functionName: "getEscrow",
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: !!userAddress && !!hasEscrow },
  });

  // 3. Create escrow
  const {
    data: createTxHash,
    writeContract: createEscrowWrite,
    isPending: isCreating,
  } = useWriteContract();

  const {
    isLoading: isWaitingCreation,
    isSuccess: isCreationConfirmed,
  } = useWaitForTransactionReceipt({
    hash: createTxHash,
  });

  const createEscrow = useMemo(() => {
    return () => {
      createEscrowWrite({
        ...escrowFactoryConfig,
        functionName: "createEscrow",
      });
    };
  }, [createEscrowWrite]);

  // Determine loading state
  const isLoading = hasEscrowLoading || escrowLoading;

  // When creation is confirmed, refetch
  useEffect(() => {
    if (isCreationConfirmed) {
      refetchHasEscrow();
      refetchEscrow();
    }
  }, [isCreationConfirmed, refetchHasEscrow, refetchEscrow]);

  return {
    escrowAddress: escrowAddress as `0x${string}` | undefined,
    hasEscrow: hasEscrow as boolean,
    isLoading,
    createEscrow,
    isCreating,
    isWaitingCreation,
    isCreationConfirmed,
    createTxHash,
  };
}