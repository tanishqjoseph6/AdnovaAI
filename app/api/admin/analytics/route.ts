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

function amountForPlan(plan: string | null | undefined): number {
  if (plan === "starter") return PLANS.starter.priceInr;
  if (plan === "pro") return PLANS.pro.priceInr;
  return 0;
}

export async function GET() {
  try {
    const authResult = await requireAdminUser({ ownerOnly: true });
    if ("response" in authResult) return authResult.response;

    const since = new Date();
    since.setDate(since.getDate() - 30);
    const sinceIso = since.toISOString();

    const [profilesResult, creditsResult, feedbackResult] = await Promise.all([
      authResult.admin
        .from("profiles")
        .select("id, plan, subscription_status, purchase_date, created_at")
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
    const credits = creditsResult.data ?? [];
    const feedback = feedbackResult.data ?? [];

    const usersGrowth = days.map((day) => ({
      day,
      value: profiles.filter((profile) => dayKey(profile.created_at) === day).length,
    }));
    const revenue = days.map((day) => ({
      day,
      value: profiles
        .filter((profile) => dayKey(profile.purchase_date) === day)
        .reduce((sum, profile) => sum + amountForPlan(profile.plan), 0),
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
      mrr: revenue,
      creditsUsage: days.map((day) => ({
        day,
        value: credits.filter((row) => dayKey(row.updated_at) === day).length,
      })),
      topPlans: planCounts,
      topCountries: [{ label: "Unknown", value: profiles.length }],
      feedbackTrend,
    });
  } catch (error) {
    console.error("Admin analytics fetch error:", error);
    return NextResponse.json(
      { error: "Unable to load analytics." },
      { status: 500 }
    );
  }
}
