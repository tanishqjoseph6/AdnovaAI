import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/admin/auth";
import { PLANS } from "@/lib/billing/plans";

function startOfTodayIso() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

function inrForPlan(plan: string | null | undefined): number {
  if (plan === "starter") return PLANS.starter.priceInr;
  if (plan === "pro") return PLANS.pro.priceInr;
  return 0;
}

export async function GET() {
  try {
    const authResult = await requireAdminUser();
    if ("response" in authResult) return authResult.response;

    const today = startOfTodayIso();
    const admin = authResult.admin;

    const [profilesResult, creditsResult, feedbackResult, auditResult] =
      await Promise.all([
        admin
          .from("profiles")
          .select("id, email, full_name, username, plan, subscription_status, account_status, created_at, purchase_date, payment_id")
          .order("created_at", { ascending: false })
          .limit(500),
        admin.from("user_credits").select("user_id, credits, updated_at").limit(1000),
        admin
          .from("user_feedback")
          .select("id, category, subject, status, created_at, user_id")
          .order("created_at", { ascending: false })
          .limit(50),
        admin
          .from("admin_audit_logs")
          .select("id, admin_email, action, target_type, target_id, created_at")
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

    if (profilesResult.error) throw profilesResult.error;

    const profiles = profilesResult.data ?? [];
    const credits = creditsResult.data ?? [];
    const feedback = feedbackResult.data ?? [];
    const paidProfiles = profiles.filter(
      (profile) =>
        (profile.plan === "starter" || profile.plan === "pro") &&
        profile.subscription_status === "active"
    );
    const monthlyRevenue = paidProfiles.reduce(
      (sum, profile) => sum + inrForPlan(profile.plan),
      0
    );

    const recentPayments = profiles
      .filter((profile) => profile.payment_id)
      .slice(0, 6)
      .map((profile) => ({
        id: profile.payment_id,
        email: profile.email,
        plan: profile.plan,
        amount: inrForPlan(profile.plan),
        date: profile.purchase_date ?? profile.created_at,
        status: profile.subscription_status,
      }));

    const recentSignups = profiles.slice(0, 6).map((profile) => ({
      id: profile.id,
      email: profile.email,
      name: profile.full_name || profile.username || profile.email,
      date: profile.created_at,
      plan: profile.plan,
    }));

    const recentFeedback = feedback.slice(0, 6).map((ticket) => ({
      id: ticket.id,
      subject: ticket.subject,
      category: ticket.category,
      status: ticket.status,
      date: ticket.created_at,
    }));

    return NextResponse.json({
      kpis: {
        totalUsers: profiles.length,
        activeUsers: profiles.filter((profile) => profile.account_status !== "suspended" && profile.account_status !== "deleted").length,
        todaysSignups: profiles.filter((profile) => profile.created_at && profile.created_at >= today).length,
        totalPaidUsers: paidProfiles.length,
        freeUsers: profiles.filter((profile) => profile.plan === "free" || !profile.plan).length,
        monthlyRevenue,
        mrr: monthlyRevenue,
        creditsUsedToday: credits.filter((row) => row.updated_at && row.updated_at >= today).length,
        totalFeedback: feedback.length,
        openTickets: feedback.filter((ticket) =>
          ticket.status === "new" || ticket.status === "in_review"
        ).length,
        resolvedTickets: feedback.filter((ticket) =>
          ticket.status === "completed" || ticket.status === "dismissed"
        ).length,
      },
      recentPayments,
      recentFeedback,
      recentSignups,
      systemHealth: {
        database: "Operational",
        auth: "Operational",
        payments: "Operational",
        ai: "Operational",
      },
      activity: (auditResult.data ?? []).map((item) => ({
        id: item.id,
        admin: item.admin_email,
        action: item.action,
        target: item.target_type,
        date: item.created_at,
      })),
    });
  } catch (error) {
    console.error("Admin overview fetch error:", error);
    return NextResponse.json(
      { error: "Unable to load admin overview." },
      { status: 500 }
    );
  }
}
