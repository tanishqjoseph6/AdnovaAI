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

export async function POST(request: Request, context: RouteContext) {
  try {
    const { postId } = await context.params;
    const auth = await requireTeamApprovalAuth();
    if ("response" in auth) return auth.response;

    if (!auth.team.permissions.canReject) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const reason =
      typeof body.reason === "string" ? body.reason.trim().slice(0, 1000) : "";

    if (reason.length < 3) {
      return NextResponse.json(
        { error: "Add a short rejection reason (at least 3 characters)." },
        { status: 400 }
      );
    }

    const loaded = await loadAccessiblePost(postId, auth.team, auth.user.id);
    if ("error" in loaded) return loaded.error;

    const { admin, row } = loaded;
    if (row.status !== "pending_approval") {
      return NextResponse.json(
        { error: "Only pending posts can be rejected." },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const { data, error } = await admin
      .from("scheduled_posts")
      .update({
        status: "rejected",
        team_id: auth.team.team.id,
        reviewed_by: auth.user.id,
        reviewed_at: now,
        rejection_reason: reason,
        updated_at: now,
      })
      .eq("id", postId)
      .select("*")
      .single();

    if (error || !data) {
      console.error("Reject post failed:", error);
      return NextResponse.json(
        { error: "Unable to reject this post." },
        { status: 500 }
      );
    }

    await logApprovalActivity({
      teamId: auth.team.team.id,
      postId,
      actorUserId: auth.user.id,
      actorEmail: auth.email,
      actorRole: auth.team.membership.role,
      action: "rejected",
      message: reason,
    });

    await logTeamAudit({
      teamId: auth.team.team.id,
      actorUserId: auth.user.id,
      actorEmail: auth.email,
      actorRole: auth.team.membership.role,
      action: "post_rejected",
      targetType: "scheduled_post",
      targetId: postId,
      metadata: { reason },
    });

    const notifyIds = [row.submitted_by, row.user_id].filter(
      (id): id is string => Boolean(id) && id !== auth.user.id
    );
    await notifyTeamUsers({
      userIds: notifyIds,
      title: "Post rejected",
      message: `${auth.email} rejected your post: ${reason}`,
    });

    return NextResponse.json({
      success: true,
      post: scheduledPostFromRow(data),
    });
  } catch (error) {
    console.error("Reject post error:", error);
    return NextResponse.json(
      { error: "Unable to reject this post." },
      { status: 500 }
    );
  }
}
