import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSiteUrl } from "@/lib/supabase/env";
import { verifyAndFulfilPayment } from "@/lib/payments/fulfill";

export const runtime = "nodejs";

function dashboardRedirect(result: string) {
  return NextResponse.redirect(new URL(`/dashboard?payment=${result}`, getSiteUrl()));
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const reference = url.searchParams.get("reference");

  if (!reference || reference.length > 100) {
    return dashboardRedirect("invalid");
  }

  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return NextResponse.redirect(new URL("/sign-in", getSiteUrl()));
  }

  const admin = createAdminClient();
  const { data: payment, error: paymentError } = await admin
    .from("payments")
    .select("*")
    .eq("provider_reference", reference)
    .eq("user_id", authData.user.id)
    .maybeSingle();

  if (paymentError || !payment) {
    return dashboardRedirect("not-found");
  }

  if (payment.status === "success") {
    return dashboardRedirect("success");
  }

  try {
    const result = await verifyAndFulfilPayment(admin, payment);
    return dashboardRedirect(result.status === "not_successful" ? "pending" : "success");
  } catch {
    return dashboardRedirect("verification-needed");
  }
}
