export interface Token {
  symbol: string;
  name: string;
  /** Token contract address on Arbitrum One. */
  address: string;
  decimals: number;
  icon: string;
}

/**
 * Canonical Arbitrum One token list used by the swap interface.
 * Addresses verified against Arbitrum's official token registry.
 */
export const ARBITRUM_TOKENS: Token[] = [
  {
    symbol: "WETH",
    name: "Wrapped Ether",
    address: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
    decimals: 18,
    icon: "⟠",
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    decimals: 6,
    icon: "💲",
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
    decimals: 6,
    icon: "💵",
  },
  {
    symbol: "ARB",
    name: "Arbitrum",
    address: "0x912CE59144191C1204E64559FE8253a0e49E6548",
    decimals: 18,
    icon: "🔷",
  },
  {
    symbol: "DAI",
    name: "Dai Stablecoin",
    address: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
    decimals: 18,
    icon: "🟡",
  },
];

export function tokenBySymbol(symbol: string): Token | undefined {
  return ARBITRUM_TOKENS.find((t) => t.symbol === symbol);
}
