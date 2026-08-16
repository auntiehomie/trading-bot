"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

interface ConfigStatus {
  walletConnect: boolean;
  oneInch: boolean;
  alpaca: boolean;
  escrowConfigured: boolean;
  escrowDeployed: boolean;
  arbitrumRpc: boolean;
}

interface StatusRow {
  label: string;
  detail: string;
  configured: boolean;
}

export default function SettingsPage() {
  const { isConnected, address } = useAccount();
  const [status, setStatus] = useState<ConfigStatus | null>(null);

  useEffect(() => {
    fetch("/api/config-status")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: ConfigStatus | null) => setStatus(data))
      .catch(() => setStatus(null));
  }, []);

  const rows: StatusRow[] = [
    {
      label: "Wallet",
      detail: isConnected
        ? `Connected (${address?.slice(0, 6)}…${address?.slice(-4)})`
        : "Not connected",
      configured: isConnected,
    },
    {
      label: "WalletConnect",
      detail: status?.walletConnect
        ? "Project ID configured"
        : "Project ID missing",
      configured: status?.walletConnect ?? false,
    },
    {
      label: "1inch Swap API",
      detail: status?.oneInch ? "API key configured" : "API key missing",
      configured: status?.oneInch ?? false,
    },
    {
      label: "Alpaca Paper Trading",
      detail: status?.alpaca ? "API keys configured" : "API keys missing",
      configured: status?.alpaca ?? false,
    },
    {
      label: "Escrow Contract",
      detail: status?.escrowDeployed
        ? "Deployed to Arbitrum"
        : "Not deployed",
      configured: status?.escrowDeployed ?? false,
    },
    {
      label: "Arbitrum RPC",
      detail: status?.arbitrumRpc ? "Custom RPC configured" : "Using public RPC",
      configured: true,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your trading bot configuration and preferences.
        </p>
      </div>

      {/* Integration Status */}
      <div className="rounded-xl border border-gray-700 bg-gray-900 p-5">
        <h3 className="mb-4 text-sm font-semibold text-white">
          Integration Status
        </h3>
        {!status ? (
          <p className="text-sm text-gray-500">Loading configuration…</p>
        ) : (
          <div className="space-y-3">
            {rows.map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between"
              >
                <div>
                  <p className="text-sm text-white">{row.label}</p>
                  <p className="text-xs text-gray-500">{row.detail}</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    row.configured
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-amber-500/10 text-amber-400"
                  }`}
                >
                  {row.configured ? "Configured" : "Missing"}
                </span>
              </div>
            ))}
          </div>
        )}
        <p className="mt-4 text-xs text-gray-600">
          Configure environment variables in{" "}
          <code className="font-mono">.env.local</code> (see{" "}
          <code className="font-mono">.env.example</code>). Restart the dev
          server after changes.
        </p>
      </div>

      {/* Network Settings */}
      <div className="rounded-xl border border-gray-700 bg-gray-900 p-5">
        <h3 className="mb-4 text-sm font-semibold text-white">Network</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white">Arbitrum</p>
            <p className="text-xs text-gray-500">
              Chain ID 42161 • Primary trading network
            </p>
          </div>
          <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
            Active
          </span>
        </div>
      </div>

      {/* Trading Preferences */}
      <div className="rounded-xl border border-gray-700 bg-gray-900 p-5">
        <h3 className="mb-4 text-sm font-semibold text-white">
          Trading Preferences
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white">Slippage Tolerance</p>
              <p className="text-xs text-gray-500">
                Maximum price slippage per trade
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button className="rounded-md bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-400">
                0.5%
              </button>
              <button className="rounded-md bg-gray-800 px-2 py-1 text-xs font-medium text-gray-400 hover:text-white">
                1.0%
              </button>
              <button className="rounded-md bg-gray-800 px-2 py-1 text-xs font-medium text-gray-400 hover:text-white">
                2.0%
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white">Max Trade Size</p>
              <p className="text-xs text-gray-500">Maximum amount per trade</p>
            </div>
            <select className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white outline-none">
              <option>1 ETH</option>
              <option>5 ETH</option>
              <option>10 ETH</option>
              <option>No Limit</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white">Paper Trading Mode</p>
              <p className="text-xs text-gray-500">Practice with virtual funds</p>
            </div>
            <button className="rounded-full bg-gray-800 px-4 py-1.5 text-xs font-medium text-gray-400">
              Enabled
            </button>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="rounded-xl border border-gray-700 bg-gray-900 p-5">
        <h3 className="mb-4 text-sm font-semibold text-white">Security</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white">Transaction Confirmation</p>
              <p className="text-xs text-gray-500">
                Require wallet confirmation for every trade
              </p>
            </div>
            <button className="rounded-full bg-emerald-500/10 px-4 py-1.5 text-xs font-medium text-emerald-400">
              Enabled
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white">Session Timeout</p>
              <p className="text-xs text-gray-500">
                Auto-disconnect after inactivity
              </p>
            </div>
            <select className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white outline-none">
              <option>30 min</option>
              <option>1 hour</option>
              <option>4 hours</option>
              <option>Never</option>
            </select>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-gray-600">
        Trading preferences and security options are persisted in a future
        release. Integration status reflects current environment variables.
      </p>
    </div>
  );
}
