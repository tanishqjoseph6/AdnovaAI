import { NextResponse } from "next/server";
import { scheduledPostFromRow } from "@/lib/social-scheduler/server";
import {
  listApproverUserIds,
  logApprovalActivity,
  logTeamAudit,
  notifyTeamUsers,
} from "@/lib/team-approval/server";
import {
  loadAccessiblePost,
  requireTeamApprovalAuth,
} from "@/lib/team-approval/api";

type RouteContext = {
  params: Promise<{ postId: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { postId } = await context.params;
    const auth = await requireTeamApprovalAuth();
    if ("response" in auth) return auth.response;

    if (!auth.team.permissions.canSubmit) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const loaded = await loadAccessiblePost(postId, auth.team, auth.user.id);
    if ("error" in loaded) return loaded.error;

    const { admin, row } = loaded;
    if (row.status !== "draft" && row.status !== "rejected") {
      return NextResponse.json(
        { error: "Only draft or rejected posts can be submitted." },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const action = row.status === "rejected" ? "resubmitted" : "submitted";

    const { data, error } = await admin
      .from("scheduled_posts")
      .update({
        status: "pending_approval",
        team_id: auth.team.team.id,
        submitted_by: auth.user.id,
        reviewed_by: null,
        reviewed_at: null,
        rejection_reason: null,
        updated_at: now,
      })
      .eq("id", postId)
      .select("*")
      .single();

    if (error || !data) {
      console.error("Submit for approval failed:", error);
      return NextResponse.json(
        { error: "Unable to submit for approval." },
        { status: 500 }
      );
    }

    await logApprovalActivity({
      teamId: auth.team.team.id,
      postId,
      actorUserId: auth.user.id,
      actorEmail: auth.email,
      actorRole: auth.team.membership.role,
      action,
      message: "Submitted for approval",
    });

    await logTeamAudit({
      teamId: auth.team.team.id,
      actorUserId: auth.user.id,
      actorEmail: auth.email,
      actorRole: auth.team.membership.role,
      action: "post_submitted_for_approval",
      targetType: "scheduled_post",
      targetId: postId,
    });

    const approvers = await listApproverUserIds(admin, auth.team.team.id);
    await notifyTeamUsers({
      userIds: approvers.filter((id) => id !== auth.user.id),
      title: "Post awaiting approval",
      message: `${auth.email} submitted a post for review in ${auth.team.team.name}.`,
    });

    return NextResponse.json({
      success: true,
      post: scheduledPostFromRow(data),
    });
  } catch (error) {
    console.error("Submit approval error:", error);
    return NextResponse.json(
      { error: "Unable to submit for approval." },
      { status: 500 }
    );
  }
}
