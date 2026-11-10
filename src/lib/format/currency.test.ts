import { describe, expect, it } from "vitest";
import { formatMoney } from "./currency";

describe("formatMoney", () => {
  it("formats kobo as Nigerian naira", () => {
    expect(formatMoney(125000)).toContain("1,250.00");
  });

  it("uses the correct zero-decimal minor unit for Japanese yen", () => {
    expect(formatMoney(1250, "JPY", "ja-JP")).toContain("1,250");
  });

  it("uses the correct three-decimal minor unit for Kuwaiti dinar", () => {
    expect(formatMoney(1250, "KWD", "en-KW")).toContain("1.250");
  });

  it("rejects fractional minor-unit values", () => {
    expect(() => formatMoney(12.5)).toThrow("safe integer");
  });

  it("rejects invalid currency codes", () => {
    expect(() => formatMoney(100, "naira")).toThrow("ISO 4217");
  });
});
