export const ARBITRUM_CHAIN_ID = 42161;

export const ARBITRUM_RPC_URL =
  process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL || "https://arb1.arbitrum.io/rpc";

export const WALLETCONNECT_PROJECT_ID =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "";

export const ONEINCH_API_KEY =
  process.env.NEXT_PUBLIC_1INCH_API_KEY || "";

export const ESCROW_CONTRACT_ADDRESS =
  process.env.ESCROW_CONTRACT_ADDRESS || "";

export const ESCROW_DEPOSIT_MINIMUM = 0.01; // ETH

export const WALLETCONNECT_PLACEHOLDER = "placeholder_replace_me";

/** True when a usable WalletConnect project ID is configured. */
export function isWalletConnectConfigured(): boolean {
  const id = WALLETCONNECT_PROJECT_ID.trim();
  return id.length > 0 && id !== WALLETCONNECT_PLACEHOLDER;
}

/** True when a usable 1inch API key is configured. */
export function isOneInchConfigured(): boolean {
  return ONEINCH_API_KEY.trim().length > 0;
}
