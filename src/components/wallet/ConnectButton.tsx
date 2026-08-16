"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { isWalletConnectConfigured } from "@/lib/constants";

const CONNECTOR_LABELS: Record<string, string> = {
  injected: "MetaMask",
  coinbaseWallet: "Coinbase",
  walletConnect: "WalletConnect",
  metaMaskSDK: "MetaMask",
};

function connectorLabel(name: string): string {
  if (name in CONNECTOR_LABELS) return CONNECTOR_LABELS[name];
  const lower = name.toLowerCase();
  if (lower.includes("injected") || lower.includes("metamask")) return "MetaMask";
  if (lower.includes("coinbase")) return "Coinbase";
  if (lower.includes("walletconnect")) return "WalletConnect";
  return name;
}

export default function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const wcConfigured = isWalletConnectConfigured();

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-400">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
        <button
          onClick={() => disconnect()}
          className="rounded-lg border border-red-500/30 px-3 py-1.5 text-sm text-red-400 transition-colors hover:border-red-500/60 hover:bg-red-500/10"
        >
          Disconnect
        </button>
      </div>
    );
  }

  const available = connectors.filter(
    (c) => wcConfigured || c.id !== "walletConnect",
  );

  return (
    <div className="flex flex-col items-end gap-2">
      {!wcConfigured && (
        <p className="max-w-xs rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-right text-xs text-red-400">
          WalletConnect project ID missing. Set{" "}
          <code className="font-mono">
            NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
          </code>{" "}
          in <code className="font-mono">.env.local</code>.
        </p>
      )}
      <div className="flex gap-2">
        {available.slice(0, 3).map((connector) => (
          <button
            key={connector.uid}
            onClick={() => connect({ connector })}
            className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-400 transition-colors hover:border-emerald-500/60 hover:bg-emerald-500/20"
          >
            {connectorLabel(connector.name)}
          </button>
        ))}
      </div>
    </div>
  );
}
