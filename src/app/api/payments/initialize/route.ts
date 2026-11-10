import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSiteUrl } from "@/lib/supabase/env";
import { initializePaystackTransaction } from "@/lib/payments/paystack";
import { verifyAndFulfilPayment } from "@/lib/payments/fulfill";

export const runtime = "nodejs";

const requestSchema = z.object({
  courseId: z.string().uuid(),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user?.email) {
    return NextResponse.json({ error: "Sign in before starting checkout." }, { status: 401 });
  }

  const payload: unknown = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: "A valid course is required." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: course, error: courseError } = await admin
    .from("courses")
    .select("id, status, price_minor, currency, published_version_id")
    .eq("id", parsed.data.courseId)
    .maybeSingle();

  if (courseError || !course || course.status !== "published" || !course.published_version_id) {
    return NextResponse.json({ error: "This course is not available for purchase." }, { status: 404 });
  }

  if (course.price_minor <= 0) {
    return NextResponse.json({ error: "This course is free. Use free enrolment instead." }, { status: 400 });
  }

  const { data: existingEnrollment } = await admin
    .from("enrollments")
    .select("id")
    .eq("user_id", authData.user.id)
    .eq("course_id", course.id)
    .in("status", ["active", "completed"])
    .maybeSingle();

  if (existingEnrollment) {
    return NextResponse.json({ error: "You already have access to this course." }, { status: 409 });
  }

  const { data: pendingPayment } = await admin
    .from("payments")
    .select("*")
    .eq("user_id", authData.user.id)
    .eq("course_id", course.id)
    .eq("status", "pending")
    .maybeSingle();

  if (pendingPayment) {
    try {
      const reconciliation = await verifyAndFulfilPayment(admin, pendingPayment);

      if (reconciliation.status !== "not_successful") {
        return NextResponse.json(
          { error: "A previous payment has been confirmed. Your course access is being updated." },
          { status: 409 },
        );
      }

      const { data: refreshedPayment } = await admin
        .from("payments")
        .select("status")
        .eq("id", pendingPayment.id)
        .single();

      if (refreshedPayment?.status === "pending") {
        return NextResponse.json(
          { error: "Your previous payment is still being confirmed. Please do not pay twice." },
          { status: 409 },
        );
      }
    } catch {
      return NextResponse.json(
        { error: "We could not safely reconcile your previous payment. Please retry later; do not start another payment." },
        { status: 503 },
      );
    }
  }

  const reference = `apt_${randomUUID().replaceAll("-", "")}`;
  const { data: payment, error: paymentError } = await admin
    .from("payments")
    .insert({
      user_id: authData.user.id,
      course_id: course.id,
      course_version_id: course.published_version_id,
      provider: "paystack",
      provider_reference: reference,
      amount_minor: course.price_minor,
      currency: course.currency,
      status: "pending",
    })
    .select("id")
    .single();

  if (paymentError || !payment) {
    return NextResponse.json({ error: "We could not create a checkout. Try again shortly." }, { status: 409 });
  }

  try {
    const checkout = await initializePaystackTransaction({
      email: authData.user.email,
      amount: course.price_minor,
      currency: course.currency,
      reference,
      callbackUrl: `${getSiteUrl()}/api/payments/callback`,
    });

    return NextResponse.json({
      authorizationUrl: checkout.authorization_url,
      reference: checkout.reference,
    });
  } catch {
    // Keep the payment pending: a network failure can happen after Paystack
    // accepted the request. Reconcile with Paystack before allowing another charge.
    return NextResponse.json(
      { error: "The payment provider did not confirm checkout initialization. Check payment status before trying again." },
      { status: 502 },
    );
  }
}
