import { NextResponse } from "next/server";
import {
  formatPaymentAmount,
  listUserPayments,
  paymentInvoiceLabel,
} from "@/lib/billing/payments";
import { getPlan, type PaidPlanId } from "@/lib/billing/plans";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "success")
      .order("created_at", { ascending: false });

    if (error) {
      if (error.code === "42P01") {
        const fallback = await listUserPayments(user.id, { successOnly: true });
        return NextResponse.json({
          payments: fallback.map((payment) => ({
            id: payment.id,
            invoiceLabel: paymentInvoiceLabel(payment),
            date: payment.createdAt,
            plan: payment.plan,
            planName: getPlan(payment.plan).name,
            amountLabel: formatPaymentAmount(payment.amount, payment.currency),
            status: payment.status,
            paymentId: payment.razorpayPaymentId,
            orderId: payment.razorpayOrderId,
            billingInterval: payment.billingInterval,
          })),
          schemaReady: false,
        });
      }

      throw error;
    }

    return NextResponse.json({
      payments: (data ?? []).map((row) => {
        const plan = row.plan as PaidPlanId;
        return {
          id: row.id,
          invoiceLabel: paymentInvoiceLabel({
            razorpayPaymentId: row.razorpay_payment_id,
          }),
          date: row.created_at,
          plan,
          planName: getPlan(plan).name,
          amountLabel: formatPaymentAmount(row.amount, row.currency),
          status: row.status,
          paymentId: row.razorpay_payment_id,
          orderId: row.razorpay_order_id,
          billingInterval: row.billing_interval,
        };
      }),
      schemaReady: true,
    });
  } catch (error) {
    console.error("[payments] User fetch error:", error);
    return NextResponse.json(
      { error: "Unable to load billing history." },
      { status: 500 }
    );
  }
}
