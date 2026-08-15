"use client";

import PortfolioSummary from "@/components/dashboard/PortfolioSummary";
import OpenPositions from "@/components/dashboard/OpenPositions";
import RecentActivity from "@/components/dashboard/RecentActivity";
import {
  mockOpenPositions,
  mockRecentActivity,
} from "@/lib/mock-data";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Your trading portfolio at a glance.
        </p>
      </div>

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