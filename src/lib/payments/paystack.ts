import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

const paystackSecretSchema = z.string().min(1);

function getPaystackSecret() {
  const parsed = paystackSecretSchema.safeParse(process.env.PAYSTACK_SECRET_KEY);
  if (!parsed.success) {
    throw new Error("PAYSTACK_SECRET_KEY is not configured.");
  }
  return parsed.data;
}

export const paystackVerificationSchema = z.object({
  status: z.literal(true),
  message: z.string(),
  data: z.object({
    id: z.number().int().positive(),
    status: z.string(),
    reference: z.string(),
    amount: z.number().int().nonnegative(),
    currency: z.string().length(3),
    paid_at: z.string().datetime({ offset: true }).nullable(),
    channel: z.string().min(1).nullable(),
    customer: z.object({ email: z.string().email() }),
  }),
});

export type PaystackVerification = z.infer<typeof paystackVerificationSchema>;

export async function initializePaystackTransaction(input: {
  email: string;
  amount: number;
  currency: string;
  reference: string;
  callbackUrl: string;
}) {
  const response = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getPaystackSecret()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: input.email,
      amount: input.amount,
      currency: input.currency,
      reference: input.reference,
      callback_url: input.callbackUrl,
    }),
    cache: "no-store",
  });

  const payload: unknown = await response.json().catch(() => null);
  const parsed = z.object({
    status: z.literal(true),
    message: z.string().optional(),
    data: z.object({
      authorization_url: z.string().url(),
      access_code: z.string().min(1),
      reference: z.string().min(1),
    }),
  }).safeParse(payload);

  if (!response.ok || !parsed.success) {
    throw new Error("Paystack could not initialize this transaction.");
  }

  if (parsed.data.data.reference !== input.reference) {
    throw new Error("Paystack returned a different transaction reference.");
  }

  return parsed.data.data;
}

export async function verifyPaystackTransaction(reference: string): Promise<PaystackVerification> {
  const response = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    {
      method: "GET",
      headers: { Authorization: `Bearer ${getPaystackSecret()}` },
      cache: "no-store",
    },
  );

  const payload: unknown = await response.json().catch(() => null);
  const parsed = paystackVerificationSchema.safeParse(payload);

  if (!response.ok || !parsed.success) {
    throw new Error("Paystack transaction verification failed.");
  }

  return parsed.data;
}

/**
 * Validates Paystack's current timestamped webhook signature format.
 * The timestamp and raw request body must be used exactly as received.
 */
export function verifyPaystackWebhookSignature(
  header: string | null,
  rawBody: string,
  signingSecret: string,
  nowMs = Date.now(),
): boolean {
  if (!header || !signingSecret) return false;

  const parts = header.split(",").map((part) => part.trim());
  const timestampPart = parts.find((part) => part.startsWith("t="));
  const timestamp = timestampPart?.slice(2);

  if (!timestamp || !/^\d{10}$/.test(timestamp)) return false;

  const timestampMs = Number(timestamp) * 1000;
  if (!Number.isFinite(timestampMs) || Math.abs(nowMs - timestampMs) > 300_000) {
    return false;
  }

  const signatures = parts
    .filter((part) => part.startsWith("v1="))
    .map((part) => part.slice(3))
    .map((value) => {
      const separator = value.indexOf(":");
      return separator >= 0 ? value.slice(separator + 1) : value;
    })
    .filter((value) => /^[a-f0-9]{128}$/i.test(value));

  if (signatures.length === 0) return false;

  const expected = createHmac("sha512", signingSecret)
    .update(`${timestamp}.${rawBody}`, "utf8")
    .digest();

  return signatures.some((signature) => {
    const supplied = Buffer.from(signature, "hex");
    return supplied.length === expected.length && timingSafeEqual(supplied, expected);
  });
}

export function sha256Hex(value: string) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}
