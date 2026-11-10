import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyAndFulfilPayment } from "@/lib/payments/fulfill";
import { sha256Hex, verifyPaystackWebhookSignature } from "@/lib/payments/paystack";

export const runtime = "nodejs";

type PaystackWebhookPayload = {
  event?: unknown;
  data?: { reference?: unknown };
};

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signingSecret = process.env.PAYSTACK_WEBHOOK_SECRET;
  const signature = request.headers.get("paystack-signature");

  if (
    !signingSecret ||
    !verifyPaystackWebhookSignature(signature, rawBody, signingSecret)
  ) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  let payload: PaystackWebhookPayload;

  try {
    payload = JSON.parse(rawBody) as PaystackWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid webhook payload." }, { status: 400 });
  }

  const eventType = typeof payload.event === "string" ? payload.event : "";
  const reference =
    typeof payload.data?.reference === "string" ? payload.data.reference : "";

  if (!eventType || reference.length > 100) {
    return NextResponse.json({ error: "Invalid webhook event." }, { status: 400 });
  }

  if (eventType === "charge.success" && !reference) {
    return NextResponse.json({ error: "Successful charge event has no reference." }, { status: 400 });
  }

  const admin = createAdminClient();
  const payloadHash = sha256Hex(rawBody);
  const eventKey = `${eventType}:${reference || payloadHash}`;

  const { error: insertError } = await admin
    .from("payment_webhook_events")
    .insert({
      provider: "paystack",
      event_key: eventKey,
      event_type: eventType,
      provider_reference: reference || null,
      payload_sha256: payloadHash,
      processing_status: "received",
    });

  if (insertError && insertError.code !== "23505") {
    return NextResponse.json({ error: "Webhook could not be recorded." }, { status: 500 });
  }

  const { data: existingEvent, error: eventReadError } = await admin
    .from("payment_webhook_events")
    .select("id, processing_status")
    .eq("provider", "paystack")
    .eq("event_key", eventKey)
    .single();

  if (eventReadError || !existingEvent) {
    return NextResponse.json({ error: "Webhook record could not be loaded." }, { status: 500 });
  }

  if (existingEvent.processing_status === "processed" || existingEvent.processing_status === "ignored") {
    return NextResponse.json({ received: true, duplicate: true });
  }

  if (eventType !== "charge.success") {
    await admin
      .from("payment_webhook_events")
      .update({ processing_status: "ignored", processed_at: new Date().toISOString() })
      .eq("id", existingEvent.id);

    return NextResponse.json({ received: true });
  }

  const { data: payment, error: paymentError } = await admin
    .from("payments")
    .select("*")
    .eq("provider_reference", reference)
    .maybeSingle();

  if (paymentError || !payment) {
    await admin
      .from("payment_webhook_events")
      .update({ processing_status: "failed", failure_code: "payment_not_found" })
      .eq("id", existingEvent.id);

    return NextResponse.json({ received: true, processed: false });
  }

  try {
    await verifyAndFulfilPayment(admin, payment);

    await admin
      .from("payment_webhook_events")
      .update({
        processing_status: "processed",
        processed_at: new Date().toISOString(),
        failure_code: null,
      })
      .eq("id", existingEvent.id);

    return NextResponse.json({ received: true, processed: true });
  } catch {
    await admin
      .from("payment_webhook_events")
      .update({
        processing_status: "failed",
        failure_code: "verification_or_fulfilment_failed",
      })
      .eq("id", existingEvent.id);

    // A non-2xx response asks Paystack to retry delivery.
    return NextResponse.json({ error: "Payment event could not be verified yet." }, { status: 500 });
  }
}
