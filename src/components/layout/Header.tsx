"use client";

import ConnectButton from "@/components/wallet/ConnectButton";

export default function Header() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-800 bg-gray-950 px-6">
      <div>
        <h1 className="text-sm font-medium text-gray-400">Arbitrum Network</h1>
      </div>
      <ConnectButton />
    </header>
  );
}