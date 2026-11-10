import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyPaystackWebhookSignature } from "./paystack";

const secret = "whsec_test_signing_secret";
const body = '{"event":"charge.success","data":{"reference":"apt_test"}}';

function makeHeader(timestamp: number) {
  const digest = createHmac("sha512", secret)
    .update(`${timestamp}.${body}`, "utf8")
    .digest("hex");

  return `t=${timestamp},v1=whk_test:${digest}`;
}

describe("verifyPaystackWebhookSignature", () => {
  it("accepts a valid timestamped signature", () => {
    const now = 1_800_000_000_000;
    expect(verifyPaystackWebhookSignature(makeHeader(now / 1000), body, secret, now)).toBe(true);
  });

  it("rejects a modified raw body", () => {
    const now = 1_800_000_000_000;
    expect(
      verifyPaystackWebhookSignature(makeHeader(now / 1000), `${body} `, secret, now),
    ).toBe(false);
  });

  it("rejects an expired timestamp", () => {
    const now = 1_800_000_000_000;
    expect(
      verifyPaystackWebhookSignature(makeHeader(now / 1000 - 301), body, secret, now),
    ).toBe(false);
  });

  it("rejects missing or malformed signatures", () => {
    expect(verifyPaystackWebhookSignature(null, body, secret)).toBe(false);
    expect(verifyPaystackWebhookSignature("t=123,v1=bad", body, secret)).toBe(false);
  });
});
