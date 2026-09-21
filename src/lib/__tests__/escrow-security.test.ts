import { describe, expect, it } from "vitest";

import { isEscrowOwnedByUser } from "@/lib/escrow-security";

describe("isEscrowOwnedByUser", () => {
  const owner = "0x1234567890abcdef1234567890abcdef12345678" as const;

  it("accepts a case-insensitive owner match", () => {
    expect(isEscrowOwnedByUser(owner, owner.toUpperCase() as `0x${string}`)).toBe(true);
  });

  it("rejects a different owner", () => {
    expect(isEscrowOwnedByUser(
      owner,
      "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
    )).toBe(false);
  });

  it("fails closed when either address is unavailable", () => {
    expect(isEscrowOwnedByUser(undefined, owner)).toBe(false);
    expect(isEscrowOwnedByUser(owner, undefined)).toBe(false);
  });
});
