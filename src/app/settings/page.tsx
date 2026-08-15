"use client";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your trading bot configuration and preferences.
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
              <p className="text-xs text-gray-500">
                Maximum amount per trade
              </p>
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
              <p className="text-xs text-gray-500">
                Practice with virtual funds
              </p>
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
        Settings are UI scaffold only. Actual configuration will be saved
        on-chain or via backend in a future release.
      </p>
    </div>
  );
}