import { ARBITRUM_SEPOLIA_CHAIN_ID, ESCROW_FACTORY_ADDRESS } from "./constants";
import { escrowFactoryAbi } from "./abis/escrowFactory";
import { escrowAbi } from "./abis/escrow";

export const escrowFactoryConfig = {
  address: ESCROW_FACTORY_ADDRESS as `0x${string}`,
  abi: escrowFactoryAbi,
  chainId: ARBITRUM_SEPOLIA_CHAIN_ID,
} as const;

export function getEscrowConfig(escrowAddress: `0x${string}`) {
  return {
    address: escrowAddress,
    abi: escrowAbi,
    chainId: ARBITRUM_SEPOLIA_CHAIN_ID,
  } as const;
}