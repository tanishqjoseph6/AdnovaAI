import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireTeamApprovalAuth } from "@/lib/team-approval/api";
import type { TeamDashboardSummary } from "@/lib/team-approval/types";

export async function GET() {
  try {
    const auth = await requireTeamApprovalAuth();
    if ("response" in auth) return auth.response;

    const admin = createAdminClient();
    const teamId = auth.team.team.id;

    const { data: posts, error } = await admin
      .from("scheduled_posts")
      .select("status")
      .eq("team_id", teamId);

    if (error) {
      console.error("Dashboard summary failed:", error);
      return NextResponse.json(
        { error: "Unable to load team dashboard." },
        { status: 500 }
      );
    }

    const summary: TeamDashboardSummary = {
      draft: 0,
      pendingApproval: 0,
      approved: 0,
      scheduled: 0,
      published: 0,
      rejected: 0,
      failed: 0,
      members: auth.team.members.filter((m) => m.status !== "removed").length,
    };

    for (const row of posts ?? []) {
      switch (row.status) {
        case "draft":
          summary.draft += 1;
          break;
        case "pending_approval":
          summary.pendingApproval += 1;
          break;
        case "approved":
          summary.approved += 1;
          break;
        case "upcoming":
          summary.scheduled += 1;
          break;
        case "published":
          summary.published += 1;
          break;
        case "rejected":
          summary.rejected += 1;
          break;
        case "failed":
          summary.failed += 1;
          break;
        default:
          break;
      }
    }

    return NextResponse.json({
      success: true,
      summary,
      team: auth.team.team,
      membership: auth.team.membership,
      permissions: auth.team.permissions,
      members: auth.team.members,
    });
  } catch (error) {
    console.error("Team dashboard GET error:", error);
    return NextResponse.json(
      { error: "Unable to load team dashboard." },
      { status: 500 }
    );
  }
}
