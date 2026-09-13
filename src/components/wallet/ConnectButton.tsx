"use client";

import { useState, useRef, useEffect } from "react";
import { useAccount, useBalance, useConnect, useDisconnect, useChainId } from "wagmi";
import { formatEther } from "viem";

export default function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { data: balance } = useBalance({ address });
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCopyAddress = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const chainName = "Arbitrum";
  const formattedBalance = balance ? Number(formatEther(balance.value)).toFixed(4) : "0.0000";

  if (!isConnected || !address) {
    return (
      <div className="flex gap-2">
        {connectors.slice(0, 3).map((connector) => (
          <button
            key={connector.uid}
            onClick={() => connect({ connector })}
            className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-400 transition-colors hover:border-emerald-500/60 hover:bg-emerald-500/20"
          >
            {connector.name === "Injected"
              ? "MetaMask"
              : connector.name === "Coinbase Wallet"
                ? "Coinbase"
                : "WalletConnect"}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm transition-colors hover:border-emerald-500/60 hover:bg-emerald-500/20"
      >
        {/* Status dot */}
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>

        <div className="text-left">
          <p className="text-xs font-medium text-emerald-400">
            {formattedBalance} ETH
          </p>
          <p className="text-[10px] text-gray-500">
            {chainName} · {address.slice(0, 6)}...{address.slice(-4)}
          </p>
        </div>

        <svg
          className={`h-3 w-3 text-gray-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {dropdownOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-gray-700 bg-gray-900 p-2 shadow-xl">
          {/* Connected wallet info */}
          <div className="rounded-lg bg-gray-800 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Connected Wallet</span>
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                {chainName}
              </span>
            </div>
            <p className="mt-1 text-xs font-mono text-gray-300 break-all">
              {address}
            </p>
          </div>

          {/* Balance */}
          <div className="mt-2 rounded-lg bg-gray-800 p-3">
            <p className="text-xs text-gray-500">Balance</p>
            <p className="mt-1 text-lg font-bold text-white">
              {formattedBalance} ETH
            </p>
          </div>

          {/* Actions */}
          <div className="mt-2 space-y-1">
            <button
              onClick={handleCopyAddress}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-gray-300 transition-colors hover:bg-gray-800"
            >
              {copied ? (
                <>
                  <span className="text-emerald-400">✓</span>
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <span>📋</span>
                  <span>Copy Address</span>
                </>
              )}
            </button>
            <button
              onClick={() => {
                setDropdownOpen(false);
                disconnect();
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-red-400 transition-colors hover:bg-red-500/10"
            >
              <span>🚪</span>
              <span>Disconnect</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}