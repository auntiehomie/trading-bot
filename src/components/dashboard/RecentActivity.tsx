"use client";

import type { Activity } from "@/lib/mock-data";

interface RecentActivityProps {
  activities: Activity[];
}

export default function RecentActivity({ activities }: RecentActivityProps) {
  const getTypeConfig = (type: Activity["type"]) => {
    switch (type) {
      case "buy":
        return { color: "text-emerald-400", bg: "bg-emerald-500/10" };
      case "sell":
        return { color: "text-red-400", bg: "bg-red-500/10" };
      case "deposit":
        return { color: "text-blue-400", bg: "bg-blue-500/10" };
      case "withdraw":
        return { color: "text-orange-400", bg: "bg-orange-500/10" };
    }
  };

  return (
    <div className="rounded-xl border border-gray-700 bg-gray-900">
      <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
        <h3 className="text-sm font-semibold text-white">Recent Activity</h3>
        <span className="text-xs text-gray-500">
          {activities.length} items
        </span>
      </div>
      <div className="divide-y divide-gray-800">
        {activities.map((activity) => {
          const config = getTypeConfig(activity.type);
          return (
            <div
              key={activity.id}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-800/30"
            >
              <span
                className={`rounded-lg p-1.5 text-xs font-medium ${config.bg} ${config.color}`}
              >
                {activity.type.toUpperCase()}
              </span>
              <div className="flex-1">
                <p className="text-sm text-white">
                  {activity.type === "deposit" || activity.type === "withdraw"
                    ? `${activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}`
                    : `${activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}`}{" "}
                  {activity.amount} {activity.symbol}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(activity.timestamp).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">
                  ${(activity.amount * activity.price).toLocaleString()}
                </p>
                <p
                  className={`text-xs ${
                    activity.status === "completed"
                      ? "text-emerald-400"
                      : activity.status === "pending"
                        ? "text-yellow-400"
                        : "text-red-400"
                  }`}
                >
                  {activity.status}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}