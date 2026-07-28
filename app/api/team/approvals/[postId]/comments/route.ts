import { NextResponse } from "next/server";
import {
  commentFromRow,
  logApprovalActivity,
  logTeamAudit,
  notifyTeamUsers,
} from "@/lib/team-approval/server";
import {
  loadAccessiblePost,
  requireTeamApprovalAuth,
} from "@/lib/team-approval/api";
import { createAdminClient } from "@/lib/supabase/admin";

type RouteContext = {
  params: Promise<{ postId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { postId } = await context.params;
    const auth = await requireTeamApprovalAuth();
    if ("response" in auth) return auth.response;

    const loaded = await loadAccessiblePost(postId, auth.team, auth.user.id);
    if ("error" in loaded) return loaded.error;

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("approval_comments")
      .select("*")
      .eq("post_id", postId)
      .eq("team_id", auth.team.team.id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Comments list failed:", error);
      return NextResponse.json(
        { error: "Unable to load comments." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      comments: (data ?? []).map((row) => commentFromRow(row)),
    });
  } catch (error) {
    console.error("Comments GET error:", error);
    return NextResponse.json(
      { error: "Unable to load comments." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { postId } = await context.params;
    const auth = await requireTeamApprovalAuth();
    if ("response" in auth) return auth.response;

    if (!auth.team.permissions.canComment) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const text = typeof body.body === "string" ? body.body.trim() : "";
    if (text.length < 1 || text.length > 2000) {
      return NextResponse.json(
        { error: "Comment must be between 1 and 2000 characters." },
        { status: 400 }
      );
    }

    const loaded = await loadAccessiblePost(postId, auth.team, auth.user.id);
    if ("error" in loaded) return loaded.error;

    const { admin, row } = loaded;

    // Ensure post is attached to team for collaboration.
    if (!row.team_id) {
      await admin
        .from("scheduled_posts")
        .update({
          team_id: auth.team.team.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", postId);
    }

    const { data, error } = await admin
      .from("approval_comments")
      .insert({
        team_id: auth.team.team.id,
        post_id: postId,
        author_user_id: auth.user.id,
        author_email: auth.email,
        author_role: auth.team.membership.role,
        body: text,
      })
      .select("*")
      .single();

    if (error || !data) {
      console.error("Comment create failed:", error);
      return NextResponse.json(
        { error: "Unable to add comment." },
        { status: 500 }
      );
    }

    await logApprovalActivity({
      teamId: auth.team.team.id,
      postId,
      actorUserId: auth.user.id,
      actorEmail: auth.email,
      actorRole: auth.team.membership.role,
      action: "commented",
      message: text.slice(0, 200),
    });

    await logTeamAudit({
      teamId: auth.team.team.id,
      actorUserId: auth.user.id,
      actorEmail: auth.email,
      actorRole: auth.team.membership.role,
      action: "comment_added",
      targetType: "scheduled_post",
      targetId: postId,
    });

    const notifyIds = [row.submitted_by, row.user_id].filter(
      (id): id is string => Boolean(id) && id !== auth.user.id
    );

    await notifyTeamUsers({
      userIds: notifyIds,
      title: "New approval comment",
      message: `${auth.email}: ${text.slice(0, 120)}`,
    });

    return NextResponse.json(
      { success: true, comment: commentFromRow(data) },
      { status: 201 }
    );
  } catch (error) {
    console.error("Comments POST error:", error);
    return NextResponse.json(
      { error: "Unable to add comment." },
      { status: 500 }
    );
  }
}
