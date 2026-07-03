import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/admin/auth";
import {
  formatPaymentAmount,
  normalizePaymentRow,
  paymentFromRow,
  type PaymentRecord,
} from "@/lib/billing/payments";

function matchesSearch(payment: PaymentRecord, search: string): boolean {
  if (!search) return true;

  const haystack = [
    payment.email,
    payment.razorpayPaymentId,
    payment.razorpayOrderId,
    payment.plan,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(search);
}

function matchesDateRange(
  createdAt: string,
  from: string | null,
  to: string | null
): boolean {
  const created = new Date(createdAt).getTime();
  if (from) {
    const fromTime = new Date(`${from}T00:00:00.000Z`).getTime();
    if (created < fromTime) return false;
  }
  if (to) {
    const toTime = new Date(`${to}T23:59:59.999Z`).getTime();
    if (created > toTime) return false;
  }
  return true;
}

function toCsvRow(values: Array<string | number | null | undefined>): string {
  return values
    .map((value) => {
      const text = value == null ? "" : String(value);
      if (text.includes(",") || text.includes('"') || text.includes("\n")) {
        return `"${text.replace(/"/g, '""')}"`;
      }
      return text;
    })
    .join(",");
}

export async function GET(request: Request) {
  try {
    const authResult = await requireAdminUser();
    if ("response" in authResult) return authResult.response;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim().toLowerCase() ?? "";
    const status = searchParams.get("status")?.trim() ?? "";
    const plan = searchParams.get("plan")?.trim() ?? "";
    const from = searchParams.get("from")?.trim() ?? "";
    const to = searchParams.get("to")?.trim() ?? "";
    const exportCsv = searchParams.get("export") === "csv";

    let query = authResult.admin
      .from("payments")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);

    if (status) {
      query = query.eq("status", status);
    }

    if (plan) {
      query = query.eq("plan", plan);
    }

    if (from) {
      query = query.gte("created_at", `${from}T00:00:00.000Z`);
    }

    if (to) {
      query = query.lte("created_at", `${to}T23:59:59.999Z`);
    }

    const { data, error } = await query;

    if (error) {
      if (error.code === "42P01") {
        return NextResponse.json({ payments: [], schemaReady: false });
      }
      throw error;
    }

    const payments = (data ?? [])
      .map((row) => normalizePaymentRow(row as Record<string, unknown>))
      .filter((row): row is NonNullable<typeof row> => row !== null)
      .map(paymentFromRow)
      .filter((payment) => matchesSearch(payment, search))
      .filter((payment) => matchesDateRange(payment.createdAt, from || null, to || null));

    if (exportCsv) {
      const header = toCsvRow([
        "Date",
        "Email",
        "Plan",
        "Amount",
        "Currency",
        "Status",
        "Payment ID",
        "Order ID",
        "Interval",
      ]);

      const rows = payments.map((payment) =>
        toCsvRow([
          payment.createdAt,
          payment.email,
          payment.plan,
          (payment.amount / 100).toFixed(2),
          payment.currency,
          payment.status,
          payment.razorpayPaymentId,
          payment.razorpayOrderId,
          payment.billingInterval ?? "",
        ])
      );

      const csv = [header, ...rows].join("\n");
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="advora-payments-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    return NextResponse.json({
      payments: payments.map((payment) => ({
        id: payment.id,
        userId: payment.userId,
        email: payment.email,
        amount: payment.amount,
        amountLabel: formatPaymentAmount(payment.amount, payment.currency),
        currency: payment.currency,
        plan: payment.plan,
        status: payment.status,
        billingInterval: payment.billingInterval,
        date: payment.createdAt,
        paymentId: payment.razorpayPaymentId,
        orderId: payment.razorpayOrderId,
      })),
      schemaReady: true,
    });
  } catch (error) {
    console.error("[admin/payments] Fetch error:", error);
    return NextResponse.json(
      { error: "Unable to load payments." },
      { status: 500 }
    );
  }
}
