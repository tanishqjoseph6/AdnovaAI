import { NextResponse } from "next/server";
import { scheduledPostFromRow } from "@/lib/social-scheduler/server";
import {
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

    if (!auth.team.permissions.canApprove) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const loaded = await loadAccessiblePost(postId, auth.team, auth.user.id);
    if ("error" in loaded) return loaded.error;

    const { admin, row } = loaded;
    if (row.status !== "pending_approval") {
      return NextResponse.json(
        { error: "Only pending posts can be approved." },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const { data, error } = await admin
      .from("scheduled_posts")
      .update({
        status: "approved",
        team_id: auth.team.team.id,
        reviewed_by: auth.user.id,
        reviewed_at: now,
        rejection_reason: null,
        updated_at: now,
      })
      .eq("id", postId)
      .select("*")
      .single();

    if (error || !data) {
      console.error("Approve post failed:", error);
      return NextResponse.json(
        { error: "Unable to approve this post." },
        { status: 500 }
      );
    }

    await logApprovalActivity({
      teamId: auth.team.team.id,
      postId,
      actorUserId: auth.user.id,
      actorEmail: auth.email,
      actorRole: auth.team.membership.role,
      action: "approved",
      message: "Approved",
    });

    await logTeamAudit({
      teamId: auth.team.team.id,
      actorUserId: auth.user.id,
      actorEmail: auth.email,
      actorRole: auth.team.membership.role,
      action: "post_approved",
      targetType: "scheduled_post",
      targetId: postId,
    });

    const notifyIds = [row.submitted_by, row.user_id].filter(
      (id): id is string => Boolean(id) && id !== auth.user.id
    );
    await notifyTeamUsers({
      userIds: notifyIds,
      title: "Post approved",
      message: `${auth.email} approved your post. It can now be scheduled.`,
    });

    return NextResponse.json({
      success: true,
      post: scheduledPostFromRow(data),
    });
  } catch (error) {
    console.error("Approve post error:", error);
    return NextResponse.json(
      { error: "Unable to approve this post." },
      { status: 500 }
    );
  }
}
