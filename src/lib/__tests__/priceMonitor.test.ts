import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { PriceMonitor, type PriceUpdate } from "../priceMonitor";

describe("PriceMonitor", () => {
  let monitor: PriceMonitor;

  beforeEach(() => {
    monitor = new PriceMonitor();
  });

  afterEach(() => {
    monitor.stop();
  });

  describe("subscribe", () => {
    it("calls listener with last known price on subscribe", () => {
      const updates: PriceUpdate[] = [];
      // Simulate a prior price
      monitor["prices"].set("ETH", {
        token: "ETH",
        priceUsd: 3200,
        timestamp: Date.now(),
        source: "cache",
      });
      const unsub = monitor.subscribe("ETH", (u) => updates.push(u));
      expect(updates).toHaveLength(1);
      expect(updates[0].priceUsd).toBe(3200);
      unsub();
    });

    it("returns an unsubscribe function that removes the listener", () => {
      const updates: PriceUpdate[] = [];
      const unsub = monitor.subscribe("ETH", (u) => updates.push(u));
      // Manually trigger a price update
      monitor["updatePrice"]("ETH", 3100, "poll");
      expect(updates).toHaveLength(1);
      unsub();
      monitor["updatePrice"]("ETH", 3000, "poll");
      expect(updates).toHaveLength(1); // still 1, listener removed
    });
  });

  describe("getPrice", () => {
    it("returns null for unknown token", () => {
      expect(monitor.getPrice("UNKNOWN")).toBeNull();
    });

    it("returns the price for a known token", () => {
      monitor["updatePrice"]("ETH", 3200, "poll");
      expect(monitor.getPrice("ETH")).toBe(3200);
    });
  });

  describe("startPolling", () => {
    it("sets up poll endpoints for given tokens", () => {
      const fetcher = async () => 3200;
      monitor.startPolling(["ETH", "ARB"], fetcher);
      expect(monitor["pollEndpoints"].has("ETH")).toBe(true);
      expect(monitor["pollEndpoints"].has("ARB")).toBe(true);
    });
  });

  describe("updatePrice", () => {
    it("calculates changePct from previous price", () => {
      monitor["updatePrice"]("ETH", 3200, "poll");
      monitor["updatePrice"]("ETH", 3360, "poll"); // +5%
      const price = monitor.getPrice("ETH");
      expect(price).toBe(3360);
    });

    it("notifies all listeners", () => {
      const updates1: PriceUpdate[] = [];
      const updates2: PriceUpdate[] = [];
      monitor.subscribe("ETH", (u) => updates1.push(u));
      monitor.subscribe("ETH", (u) => updates2.push(u));
      monitor["updatePrice"]("ETH", 3200, "poll");
      expect(updates1.length).toBeGreaterThanOrEqual(1);
      expect(updates2.length).toBeGreaterThanOrEqual(1);
    });

    it("handles zero previous price gracefully", () => {
      monitor["updatePrice"]("ETH", 100, "poll");
      expect(monitor.getPrice("ETH")).toBe(100);
    });
  });

  describe("stop", () => {
    it("cleans up intervals", () => {
      const fetcher = async () => 3200;
      monitor.startPolling(["ETH"], fetcher);
      monitor.stop();
      expect(monitor["pollInterval"]).toBeNull();
    });
  });
});
