import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/admin/auth";
import { PLANS } from "@/lib/billing/plans";

function dayKey(iso: string | null | undefined): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

function last30Days() {
  return Array.from({ length: 30 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - index));
    return date.toISOString().slice(0, 10);
  });
}

function usdForPlan(plan: string | null | undefined): number {
  if (plan === "starter") return PLANS.starter.priceUsd;
  if (plan === "pro") return PLANS.pro.priceUsd;
  return 0;
}

export async function GET() {
  try {
    const authResult = await requireAdminUser({ ownerOnly: true });
    if ("response" in authResult) return authResult.response;

    const since = new Date();
    since.setDate(since.getDate() - 30);
    const sinceIso = since.toISOString();

    const [profilesResult, paymentsResult, creditsResult, feedbackResult] =
      await Promise.all([
        authResult.admin
          .from("profiles")
          .select("id, plan, subscription_status, purchase_date, created_at")
          .gte("created_at", sinceIso)
          .limit(1000),
        authResult.admin
          .from("payments")
          .select("plan, amount_usd_minor, amount, currency, status, created_at")
          .eq("status", "success")
          .gte("created_at", sinceIso)
          .limit(1000),
        authResult.admin
          .from("user_credits")
          .select("credits, plan, updated_at")
          .gte("updated_at", sinceIso)
          .limit(1000),
        authResult.admin
          .from("user_feedback")
          .select("id, category, created_at")
          .gte("created_at", sinceIso)
          .limit(1000),
      ]);

    if (profilesResult.error) throw profilesResult.error;

    const days = last30Days();
    const profiles = profilesResult.data ?? [];
    const payments = paymentsResult.data ?? [];
    const credits = creditsResult.data ?? [];
    const feedback = feedbackResult.data ?? [];

    const usersGrowth = days.map((day) => ({
      day,
      value: profiles.filter((profile) => dayKey(profile.created_at) === day).length,
    }));

    const revenue = days.map((day) => ({
      day,
      value: payments
        .filter((payment) => dayKey(payment.created_at) === day)
        .reduce((sum, payment) => {
          if (typeof payment.amount_usd_minor === "number") {
            return sum + payment.amount_usd_minor / 100;
          }
          return sum + usdForPlan(payment.plan);
        }, 0),
    }));

    const feedbackTrend = days.map((day) => ({
      day,
      value: feedback.filter((item) => dayKey(item.created_at) === day).length,
    }));

    const planCounts = ["free", "starter", "pro", "custom"].map((plan) => ({
      label: plan,
      value: profiles.filter((profile) => profile.plan === plan).length,
    }));

    return NextResponse.json({
      range: "last_30_days",
      usersGrowth,
      revenue,
      feedbackTrend,
      planCounts,
      creditUsage: credits.length,
    });
  } catch (error) {
    console.error("Admin analytics fetch error:", error);
    return NextResponse.json(
      { error: "Unable to load admin analytics." },
      { status: 500 }
    );
  }
}
