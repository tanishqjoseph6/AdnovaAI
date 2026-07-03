import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/admin/auth";
import { PLANS } from "@/lib/billing/plans";

function amountForPlan(plan: string | null | undefined): number {
  if (plan === "starter") return PLANS.starter.priceInr;
  if (plan === "pro") return PLANS.pro.priceInr;
  return 0;
}

export async function GET(request: Request) {
  try {
    const authResult = await requireAdminUser({ ownerOnly: true });
    if ("response" in authResult) return authResult.response;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim().toLowerCase() ?? "";
    const status = searchParams.get("status")?.trim() ?? "";

    const { data, error } = await authResult.admin
      .from("profiles")
      .select("id, email, plan, subscription_status, payment_id, razorpay_order_id, purchase_date, created_at")
      .not("payment_id", "is", null)
      .order("purchase_date", { ascending: false })
      .limit(100);

    if (error) throw error;

    const payments = (data ?? [])
      .filter((row) => {
        const matchesSearch =
          !search ||
          row.email?.toLowerCase().includes(search) ||
          row.payment_id?.toLowerCase().includes(search) ||
          row.razorpay_order_id?.toLowerCase().includes(search);
        const matchesStatus = !status || row.subscription_status === status;
        return matchesSearch && matchesStatus;
      })
      .map((row) => ({
        id: row.payment_id,
        userId: row.id,
        email: row.email,
        amount: amountForPlan(row.plan),
        plan: row.plan ?? "free",
        status: row.subscription_status ?? "inactive",
        date: row.purchase_date ?? row.created_at,
        invoice: row.razorpay_order_id,
        paymentId: row.payment_id,
      }));

    return NextResponse.json({ payments });
  } catch (error) {
    console.error("Admin payments fetch error:", error);
    return NextResponse.json(
      { error: "Unable to load payments." },
      { status: 500 }
    );
  }
}
