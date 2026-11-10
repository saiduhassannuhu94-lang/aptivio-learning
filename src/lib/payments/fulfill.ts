import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/types/database";
import { verifyPaystackTransaction } from "./paystack";

type Payment = Tables<"payments">;

export type FulfilmentResult =
  | { status: "fulfilled"; enrollmentId: string }
  | { status: "already_fulfilled"; enrollmentId: string | null }
  | { status: "not_successful" };

export async function verifyAndFulfilPayment(
  admin: SupabaseClient<Database>,
  payment: Payment,
): Promise<FulfilmentResult> {
  if (payment.status === "success") {
    const { data: enrollment } = await admin
      .from("enrollments")
      .select("id")
      .eq("payment_id", payment.id)
      .maybeSingle();

    return {
      status: "already_fulfilled",
      enrollmentId: enrollment?.id ?? null,
    };
  }

  if (payment.status !== "pending") {
    throw new Error("This payment is not awaiting verification.");
  }

  const verification = await verifyPaystackTransaction(payment.provider_reference);
  const transaction = verification.data;

  if (transaction.status !== "success") {
    if (["failed", "abandoned", "reversed"].includes(transaction.status)) {
      await admin
        .from("payments")
        .update({ status: transaction.status })
        .eq("id", payment.id)
        .eq("status", "pending");
    }

    return { status: "not_successful" };
  }

  if (
    transaction.reference !== payment.provider_reference ||
    transaction.amount !== payment.amount_minor ||
    transaction.currency !== payment.currency
  ) {
    throw new Error("Verified transaction details do not match the payment intent.");
  }

  const { data: authUser, error: authUserError } =
    await admin.auth.admin.getUserById(payment.user_id);

  if (authUserError || !authUser.user.email) {
    throw new Error("The payment owner could not be verified.");
  }

  if (authUser.user.email.toLowerCase() !== transaction.customer.email.toLowerCase()) {
    throw new Error("The Paystack customer does not match the account that initiated payment.");
  }

  const { data: enrollmentId, error: fulfilmentError } = await admin.rpc(
    "fulfill_verified_paystack_payment",
    {
      p_reference: payment.provider_reference,
      p_transaction_id: transaction.id,
      p_verified_amount: transaction.amount,
      p_verified_currency: transaction.currency,
      p_provider_paid_at: transaction.paid_at,
      p_provider_channel: transaction.channel,
    },
  );

  if (fulfilmentError || !enrollmentId) {
    throw new Error("Verified payment could not be converted into course access.");
  }

  return { status: "fulfilled", enrollmentId };
}
