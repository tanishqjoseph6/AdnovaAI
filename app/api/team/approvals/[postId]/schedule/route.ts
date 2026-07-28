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

    if (!auth.team.permissions.canSchedule) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;

    const loaded = await loadAccessiblePost(postId, auth.team, auth.user.id);
    if ("error" in loaded) return loaded.error;

    const { admin, row } = loaded;
    if (row.status !== "approved") {
      return NextResponse.json(
        { error: "Only approved posts can be scheduled." },
        { status: 400 }
      );
    }

    let scheduledFor = row.scheduled_for;
    if (typeof body.scheduledFor === "string" && body.scheduledFor.trim()) {
      const next = new Date(body.scheduledFor);
      if (Number.isNaN(next.getTime()) || next.getTime() < Date.now() - 60_000) {
        return NextResponse.json(
          { error: "Choose a valid future schedule time." },
          { status: 400 }
        );
      }
      scheduledFor = next.toISOString();
    } else {
      const existing = new Date(scheduledFor);
      if (Number.isNaN(existing.getTime()) || existing.getTime() < Date.now() - 60_000) {
        return NextResponse.json(
          { error: "Update the schedule time before scheduling." },
          { status: 400 }
        );
      }
    }

    const now = new Date().toISOString();
    const { data, error } = await admin
      .from("scheduled_posts")
      .update({
        status: "upcoming",
        scheduled_for: scheduledFor,
        team_id: auth.team.team.id,
        updated_at: now,
      })
      .eq("id", postId)
      .select("*")
      .single();

    if (error || !data) {
      console.error("Schedule approved post failed:", error);
      return NextResponse.json(
        { error: "Unable to schedule this post." },
        { status: 500 }
      );
    }

    await logApprovalActivity({
      teamId: auth.team.team.id,
      postId,
      actorUserId: auth.user.id,
      actorEmail: auth.email,
      actorRole: auth.team.membership.role,
      action: "scheduled",
      message: `Scheduled for ${scheduledFor}`,
      metadata: { scheduledFor },
    });

    await logTeamAudit({
      teamId: auth.team.team.id,
      actorUserId: auth.user.id,
      actorEmail: auth.email,
      actorRole: auth.team.membership.role,
      action: "post_scheduled",
      targetType: "scheduled_post",
      targetId: postId,
      metadata: { scheduledFor },
    });

    const notifyIds = [row.submitted_by, row.user_id].filter(
      (id): id is string => Boolean(id) && id !== auth.user.id
    );
    await notifyTeamUsers({
      userIds: notifyIds,
      title: "Post scheduled",
      message: `An approved post was scheduled by ${auth.email}.`,
    });

    return NextResponse.json({
      success: true,
      post: scheduledPostFromRow(data),
    });
  } catch (error) {
    console.error("Schedule approved post error:", error);
    return NextResponse.json(
      { error: "Unable to schedule this post." },
      { status: 500 }
    );
  }
}
