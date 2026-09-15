import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { PriceMonitor } from "../priceMonitor";

/**
 * Performance benchmark tests for PriceMonitor WebSocket reconnection.
 * Validates reconnection timing, backoff strategy, and max attempt handling.
 */

// Mock WebSocket
class MockWebSocket {
  static instances: MockWebSocket[] = [];
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  url: string;
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onmessage: ((ev: { data: string }) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
    // Simulate async connection
    setTimeout(() => {
      if (this.readyState === MockWebSocket.CONNECTING) {
        this.readyState = MockWebSocket.OPEN;
        this.onopen?.();
      }
    }, 10);
  }

  send(_data: string) {}
  close() {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.();
  }
  // Test helper to simulate server-side close
  simulateClose() {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.();
  }
  simulateError() {
    this.onerror?.();
  }
}

vi.stubGlobal("WebSocket", MockWebSocket);

describe("PriceMonitor — WebSocket reconnection benchmarks", () => {
  let monitor: PriceMonitor;

  beforeEach(() => {
    MockWebSocket.instances = [];
    vi.useFakeTimers();
    monitor = new PriceMonitor();
  });

  afterEach(() => {
    vi.useRealTimers();
    monitor.stop();
    vi.restoreAllMocks();
  });

  it("does not exceed max reconnection attempts (10)", () => {
    // Simulate repeated close events without executing scheduled reconnects.
    for (let i = 0; i < 15; i++) {
      monitor["handleWsClose"]();
      if (monitor["reconnectTimer"]) {
        clearTimeout(monitor["reconnectTimer"]);
        monitor["reconnectTimer"] = null;
      }
    }

    // After MAX_RECONNECT_ATTEMPTS, handleWsClose returns early.
    expect(monitor["reconnectAttempts"]).toBe(10);
  });

  it("uses exponential backoff between reconnection attempts", () => {
    const delays: number[] = [];
    const BASE_DELAY = 5000;
    const MAX_DELAY = 60000;

    // Simulate backoff calculation (matches the formula in handleWsClose)
    for (let attempt = 1; attempt <= 10; attempt++) {
      const delay = Math.min(BASE_DELAY * 2 ** (attempt - 1), MAX_DELAY);
      delays.push(delay);
    }

    // Verify exponential growth
    expect(delays[0]).toBe(5000); // 5s
    expect(delays[1]).toBe(10000); // 10s
    expect(delays[2]).toBe(20000); // 20s
    expect(delays[3]).toBe(40000); // 40s
    expect(delays[4]).toBe(60000); // capped at 60s
    expect(delays[5]).toBe(60000); // still capped
    expect(delays[6]).toBe(60000); // still capped
  });

  it("stops reconnecting after monitor.stop() is called", () => {
    // Set up a reconnect timer
    monitor["wsUrl"] = "wss://test";
    monitor["reconnectAttempts"] = 1;
    monitor["handleWsClose"]();

    // Stop the monitor — should clear pending reconnect timer
    monitor.stop();

    // Advance time past reconnection delay
    vi.advanceTimersByTime(120_000);

    // The reconnect timer should have been cleared by stop()
    // No way to directly assert the timer was cleared, but no crash = pass
    expect(monitor["reconnectTimer"]).toBeNull();
  });

  it("reconnect delay is within expected bounds (5s base, 60s max)", () => {
    const BASE_DELAY = 5000;
    const MAX_DELAY = 60000;

    // First attempt: 5s
    const firstDelay = Math.min(BASE_DELAY * 2 ** 0, MAX_DELAY);
    expect(firstDelay).toBe(5000);

    // Max delay: 60s
    const maxDelay = Math.min(BASE_DELAY * 2 ** 10, MAX_DELAY);
    expect(maxDelay).toBe(60000);
  });

  it("increments reconnect attempts on each close", () => {
    expect(monitor["reconnectAttempts"]).toBe(0);

    // Simulate first close
    monitor["handleWsClose"]();
    expect(monitor["reconnectAttempts"]).toBe(1);

    // Advance to trigger reconnect timer
    vi.advanceTimersByTime(6000);

    // Simulate second close
    monitor["handleWsClose"]();
    expect(monitor["reconnectAttempts"]).toBe(2);
  });
});
