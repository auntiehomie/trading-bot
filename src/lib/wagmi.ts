import { http, createConfig } from "@wagmi/core";
import { arbitrum } from "@wagmi/core/chains";
import { walletConnect, injected, coinbaseWallet } from "@wagmi/connectors";
import { ARBITRUM_RPC_URL, WALLETCONNECT_PROJECT_ID } from "./constants";

export const config = createConfig({
  chains: [arbitrum],
  connectors: [
    injected(),
    coinbaseWallet({
      appName: "TradingHomie",
      appLogoUrl: "",
    }),
    walletConnect({
      projectId: WALLETCONNECT_PROJECT_ID,
      showQrModal: true,
    }),
  ],
  transports: {
    [arbitrum.id]: http(ARBITRUM_RPC_URL),
  },
});

declare module "@wagmi/core" {
  interface Register {
    config: typeof config;
  }
}