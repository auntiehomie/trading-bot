/**
 * WebSocket-based real-time price monitoring for swap execution.
 * Subscribes to DEX pool events and price feeds for live execution decisions.
 *
 * Architecture:
 * - Primary: UniV3 pool WebSocket subscriptions (if available)
 * - Fallback: Polling Chainlink/UniV3 oracles at 2s intervals
 * - Alerting: Gas spike + price movement alerts via alerts.ts
 */

import { sendAlert, gasSpikeAlert } from "./infrastructure/alerts";

export interface PriceUpdate {
  token: string;
  priceUsd: number;
  timestamp: number;
  source: "websocket" | "poll" | "cache";
  changePct?: number; // change since last update
}

export interface PriceSubscription {
  token: string;
  unsubscribe: () => void;
}

type PriceListener = (update: PriceUpdate) => void;

const POLL_INTERVAL_MS = 2000;
const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_BASE_DELAY_MS = 5000;
const RECONNECT_MAX_DELAY_MS = 60000;
const GAS_SPIKE_THRESHOLD_GWEI = 50;
const PRICE_CHANGE_ALERT_PCT = 5;

export class PriceMonitor {
  private listeners = new Map<string, Set<PriceListener>>();
  private prices = new Map<string, PriceUpdate>();
  private pollInterval: ReturnType<typeof setInterval> | null = null;
  private ws: WebSocket | null = null;
  private wsUrl: string | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pollEndpoints: Map<string, () => Promise<number | null>> = new Map();
  private gasPollInterval: ReturnType<typeof setInterval> | null = null;

  /**
   * Subscribe to price updates for a token.
   * Returns an unsubscribe function.
   */
  subscribe(token: string, listener: PriceListener): () => void {
    if (!this.listeners.has(token)) {
      this.listeners.set(token, new Set());
    }
    this.listeners.get(token)!.add(listener);

    // Send last known price immediately
    const lastPrice = this.prices.get(token);
    if (lastPrice) {
      listener(lastPrice);
    }

    return () => {
      this.listeners.get(token)?.delete(listener);
      if (this.listeners.get(token)?.size === 0) {
        this.listeners.delete(token);
      }
    };
  }

  /**
   * Start polling price for a set of tokens via REST endpoints.
   * Used as a primary or fallback price source.
   */
  startPolling(
    tokens: string[],
    priceFetcher: (token: string) => Promise<number | null>,
  ): void {
    for (const token of tokens) {
      this.pollEndpoints.set(token, () => priceFetcher(token));
    }

    if (!this.pollInterval) {
      this.pollInterval = setInterval(() => void this.pollAll(), POLL_INTERVAL_MS);
    }
  }

  /**
   * Connect to a WebSocket price feed (e.g., UniV3 pool events, Chainlink pushes).
   */
  async connectWebSocket(url: string): Promise<void> {
    if (typeof WebSocket === "undefined") {
      console.warn("WebSocket not available in this environment — falling back to polling");
      return;
    }

    this.wsUrl = url;
    try {
      this.ws = new WebSocket(url);
      this.ws.onmessage = (event) => this.handleWsMessage(event);
      this.ws.onclose = () => this.handleWsClose();
      this.ws.onerror = (err) => {
        console.warn("Price WebSocket error:", err);
        this.handleWsClose();
      };
      this.reconnectAttempts = 0;
    } catch (err) {
      console.warn("Failed to connect WebSocket:", err);
      this.handleWsClose();
    }
  }

  /**
   * Start monitoring gas prices for spike alerts.
   */
  startGasMonitor(
    gasFetcher: () => Promise<number>,
    intervalMs: number = 30000,
  ): void {
    if (this.gasPollInterval) clearInterval(this.gasPollInterval);
    this.gasPollInterval = setInterval(async () => {
      try {
        const gwei = await gasFetcher();
        if (gwei > GAS_SPIKE_THRESHOLD_GWEI) {
          await sendAlert(gasSpikeAlert(gwei, GAS_SPIKE_THRESHOLD_GWEI));
        }
      } catch (err) {
        console.warn("Gas monitor error:", err);
      }
    }, intervalMs);
  }

  /**
   * Get the latest known price for a token.
   */
  getPrice(token: string): number | null {
    return this.prices.get(token)?.priceUsd ?? null;
  }

  /**
   * Stop all polling and WebSocket connections.
   */
  stop(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    if (this.gasPollInterval) {
      clearInterval(this.gasPollInterval);
      this.gasPollInterval = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private async pollAll(): Promise<void> {
    const promises: Promise<void>[] = [];
    for (const [token, fetcher] of this.pollEndpoints) {
      promises.push(
        (async () => {
          try {
            const price = await fetcher();
            if (price != null) {
              this.updatePrice(token, price, "poll");
            }
          } catch (err) {
            console.warn(`Price poll failed for ${token}:`, err);
          }
        })(),
      );
    }
    await Promise.allSettled(promises);
  }

  private handleWsMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);
      if (data.token && data.priceUsd) {
        this.updatePrice(data.token, data.priceUsd, "websocket");
      }
    } catch {
      // Ignore malformed messages
    }
  }

  private handleWsClose(): void {
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.warn(
        `Price WebSocket: giving up after ${MAX_RECONNECT_ATTEMPTS} reconnect attempts — using polling only`,
      );
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      RECONNECT_BASE_DELAY_MS * 2 ** (this.reconnectAttempts - 1),
      RECONNECT_MAX_DELAY_MS,
    );
    console.warn(
      `Price WebSocket: reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`,
    );

    this.reconnectTimer = setTimeout(() => {
      if (this.wsUrl) void this.connectWebSocket(this.wsUrl);
    }, delay);
  }

  private updatePrice(
    token: string,
    priceUsd: number,
    source: "websocket" | "poll" | "cache",
  ): void {
    const previous = this.prices.get(token);
    const changePct = previous
      ? ((priceUsd - previous.priceUsd) / previous.priceUsd) * 100
      : 0;

    const update: PriceUpdate = {
      token,
      priceUsd,
      timestamp: Date.now(),
      source,
      changePct,
    };

    this.prices.set(token, update);

    // Alert on significant price movements
    if (Math.abs(changePct) >= PRICE_CHANGE_ALERT_PCT) {
      console.warn(
        `Price alert: ${token} ${changePct > 0 ? "+" : ""}${changePct.toFixed(2)}% → $${priceUsd}`,
      );
    }

    // Notify listeners
    const tokenListeners = this.listeners.get(token);
    if (tokenListeners) {
      for (const listener of tokenListeners) {
        try {
          listener(update);
        } catch (err) {
          console.warn(`Price listener error for ${token}:`, err);
        }
      }
    }
  }
}

/**
 * Singleton instance for app-wide use.
 */
export const priceMonitor = new PriceMonitor();
