import { NextResponse } from "next/server";
import { requireVerifiedUser } from "@/lib/auth/require-user";
import { requireFeatureAccess } from "@/lib/billing/plan-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { scheduledPostFromRow } from "@/lib/social-scheduler/server";
import { requireTeamContext } from "@/lib/team-approval/server";
import {
  isApprovalWorkflowStatus,
  type ApprovalWorkflowStatus,
} from "@/lib/team-approval/types";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const authResult = await requireVerifiedUser(supabase);
    if ("response" in authResult) return authResult.response;

    const featureResult = await requireFeatureAccess(
      supabase,
      authResult.user.id,
      "social_scheduler"
    );
    if ("response" in featureResult) return featureResult.response;

    const email = authResult.user.email;
    if (!email) {
      return NextResponse.json({ error: "Email required." }, { status: 400 });
    }

    const context = await requireTeamContext({
      userId: authResult.user.id,
      email,
    });

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");
    const search = (searchParams.get("search") ?? "").trim().toLowerCase();

    const admin = createAdminClient();
    let query = admin
      .from("scheduled_posts")
      .select("*")
      .eq("team_id", context.team.id)
      .order("updated_at", { ascending: false })
      .limit(200);

    if (statusParam && isApprovalWorkflowStatus(statusParam)) {
      query = query.eq("status", statusParam as ApprovalWorkflowStatus);
    }

    // Also include owner drafts not yet tagged with team_id (legacy/own posts).
    const { data: teamPosts, error } = await query;
    if (error) {
      console.error("Approvals list failed:", error);
      return NextResponse.json(
        { error: "Unable to load approval queue." },
        { status: 500 }
      );
    }

    const { data: ownUntagged } = await admin
      .from("scheduled_posts")
      .select("*")
      .eq("user_id", authResult.user.id)
      .is("team_id", null)
      .in("status", ["draft", "rejected", "pending_approval", "approved"])
      .order("updated_at", { ascending: false })
      .limit(100);

    const merged = [...(teamPosts ?? []), ...(ownUntagged ?? [])];
    const seen = new Set<string>();
    let posts = merged
      .filter((row) => {
        if (seen.has(row.id)) return false;
        seen.add(row.id);
        return true;
      })
      .map((row) => scheduledPostFromRow(row));

    if (search) {
      posts = posts.filter(
        (post) =>
          post.caption.toLowerCase().includes(search) ||
          (post.notes ?? "").toLowerCase().includes(search) ||
          (post.rejectionReason ?? "").toLowerCase().includes(search)
      );
    }

    if (statusParam && isApprovalWorkflowStatus(statusParam)) {
      posts = posts.filter((post) => post.status === statusParam);
    }

    return NextResponse.json({
      success: true,
      posts,
      permissions: context.permissions,
      team: context.team,
    });
  } catch (error) {
    console.error("Approvals GET error:", error);
    return NextResponse.json(
      { error: "Unable to load approval queue." },
      { status: 500 }
    );
  }
}
