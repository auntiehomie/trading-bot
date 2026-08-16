import { http, createConfig } from "@wagmi/core";
import { arbitrum } from "@wagmi/core/chains";
import { walletConnect, injected, coinbaseWallet } from "@wagmi/connectors";
import {
  ARBITRUM_RPC_URL,
  WALLETCONNECT_PROJECT_ID,
  isWalletConnectConfigured,
} from "./constants";

const connectors = [
  injected(),
  coinbaseWallet({
    appName: "TradingHomie",
    appLogoUrl: "",
  }),
  // WalletConnect requires a real project ID — only register the connector when
  // one is configured so the app still works with injected/Coinbase wallets.
  ...(isWalletConnectConfigured()
    ? [
        walletConnect({
          projectId: WALLETCONNECT_PROJECT_ID,
          showQrModal: true,
        }),
      ]
    : []),
];

export const config = createConfig({
  chains: [arbitrum],
  connectors,
  transports: {
    [arbitrum.id]: http(ARBITRUM_RPC_URL),
  },
});

declare module "@wagmi/core" {
  interface Register {
    config: typeof config;
  }
}
