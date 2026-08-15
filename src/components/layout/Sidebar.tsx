"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/trade", label: "Trade", icon: "💱" },
  { href: "/paper-trading", label: "Paper Trading", icon: "📝" },
  { href: "/escrow", label: "Escrow", icon: "🔐" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-gray-800 bg-gray-950">
      <div className="flex h-16 items-center gap-3 border-b border-gray-800 px-6">
        <span className="text-xl">🤖</span>
        <span className="text-lg font-bold text-white">TradingHomie</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-800 p-4">
        <div className="rounded-lg bg-gray-900 p-3">
          <p className="text-xs text-gray-500">Escrow Balance</p>
          <p className="text-lg font-semibold text-white">0.45 ETH</p>
        </div>
      </div>
    </aside>
  );
}