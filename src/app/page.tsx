"use client";

import { useAccount } from "wagmi";
import PortfolioSummary from "@/components/dashboard/PortfolioSummary";
import OpenPositions from "@/components/dashboard/OpenPositions";
import RecentActivity from "@/components/dashboard/RecentActivity";
import {
  mockOpenPositions,
  mockRecentActivity,
} from "@/lib/mock-data";

export default function DashboardPage() {
  const { isConnected } = useAccount();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Your trading portfolio at a glance.
        </p>
      </div>

      {!isConnected && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-6 text-center">
          <h2 className="text-lg font-semibold text-emerald-400">
            Connect Your Wallet to Start Trading
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Connect your wallet using the button in the header to view your
            portfolio, deposit funds, and execute trades on Arbitrum.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
            <span>🟢</span>
            <span>Arbitrum Network</span>
            <span className="ml-4">🔐</span>
            <span>Secure WalletConnect</span>
          </div>
        </div>
      )}

      <PortfolioSummary />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <OpenPositions positions={mockOpenPositions} />
        </div>
        <div>
          <RecentActivity activities={mockRecentActivity} />
        </div>
      </div>
    </div>
  );
}