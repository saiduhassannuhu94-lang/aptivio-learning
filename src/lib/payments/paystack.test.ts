import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { paystackVerificationSchema, verifyPaystackWebhookSignature } from "./paystack";

const secret = "whsec_test_signing_secret";
const body = '{"event":"charge.success","data":{"reference":"apt_test"}}';

function makeHeader(timestamp: number) {
  const digest = createHmac("sha512", secret)
    .update(`${timestamp}.${body}`, "utf8")
    .digest("hex");

  return `t=${timestamp},v1=whk_test:${digest}`;
}

describe("Paystack verification response parsing", () => {
  it("accepts pending transactions with no settlement timestamp or channel", () => {
    const parsed = paystackVerificationSchema.safeParse({
      status: true,
      message: "Verification successful",
      data: {
        id: 123,
        status: "pending",
        reference: "apt_pending",
        amount: 250000,
        currency: "NGN",
        paid_at: null,
        channel: null,
        customer: { email: "learner@example.com" },
      },
    });

    expect(parsed.success).toBe(true);
  });
});

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
