import { describe, expect, it } from "vitest";
import { formatMoney } from "./currency";

describe("formatMoney", () => {
  it("formats kobo as Nigerian naira", () => {
    expect(formatMoney(125000)).toContain("1,250.00");
  });

  it("rejects fractional minor-unit values", () => {
    expect(() => formatMoney(12.5)).toThrow("safe integer");
  });

  it("rejects invalid currency codes", () => {
    expect(() => formatMoney(100, "naira")).toThrow("ISO 4217");
  });
});
