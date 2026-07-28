import { NextResponse } from "next/server";
import { requireVerifiedUser } from "@/lib/auth/require-user";
import { requireFeatureAccess } from "@/lib/billing/plan-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { canAssignRole } from "@/lib/team-approval/permissions";
import {
  logTeamAudit,
  memberFromRow,
  requireTeamContext,
} from "@/lib/team-approval/server";
import { isTeamRole, type TeamRole } from "@/lib/team-approval/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const authResult = await requireVerifiedUser(supabase);
    if ("response" in authResult) return authResult.response;

    const featureResult = await requireFeatureAccess(
      supabase,
      authResult.user.id,
      "social_scheduler"
    );
    if ("response" in featureResult) return featureResult.response;

    const actorEmail = authResult.user.email;
    if (!actorEmail) {
      return NextResponse.json({ error: "Email required." }, { status: 400 });
    }

    const teamContext = await requireTeamContext({
      userId: authResult.user.id,
      email: actorEmail,
    });

    if (!teamContext.permissions.canManageMembers) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    if (!isTeamRole(body.role) || body.role === "owner") {
      return NextResponse.json({ error: "Invalid role." }, { status: 400 });
    }
    const role = body.role as TeamRole;

    if (!canAssignRole(teamContext.membership.role, role)) {
      return NextResponse.json(
        { error: "You cannot assign that role." },
        { status: 403 }
      );
    }

    const admin = createAdminClient();
    const { data: existing, error: loadError } = await admin
      .from("team_members")
      .select("*")
      .eq("id", id)
      .eq("team_id", teamContext.team.id)
      .neq("status", "removed")
      .maybeSingle();

    if (loadError || !existing) {
      return NextResponse.json({ error: "Member not found." }, { status: 404 });
    }

    if (existing.role === "owner") {
      return NextResponse.json(
        { error: "Cannot change the owner role." },
        { status: 400 }
      );
    }

    const { data, error } = await admin
      .from("team_members")
      .update({ role, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .single();

    if (error || !data) {
      console.error("Member role update failed:", error);
      return NextResponse.json(
        { error: "Unable to update member role." },
        { status: 500 }
      );
    }

    const member = memberFromRow(data);
    await logTeamAudit({
      teamId: teamContext.team.id,
      actorUserId: authResult.user.id,
      actorEmail,
      actorRole: teamContext.membership.role,
      action: "member_role_changed",
      targetType: "team_member",
      targetId: member.id,
      metadata: { email: member.email, role },
    });

    return NextResponse.json({ success: true, member });
  } catch (error) {
    console.error("Team member PATCH error:", error);
    return NextResponse.json(
      { error: "Unable to update member role." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const authResult = await requireVerifiedUser(supabase);
    if ("response" in authResult) return authResult.response;

    const featureResult = await requireFeatureAccess(
      supabase,
      authResult.user.id,
      "social_scheduler"
    );
    if ("response" in featureResult) return featureResult.response;

    const actorEmail = authResult.user.email;
    if (!actorEmail) {
      return NextResponse.json({ error: "Email required." }, { status: 400 });
    }

    const teamContext = await requireTeamContext({
      userId: authResult.user.id,
      email: actorEmail,
    });

    if (!teamContext.permissions.canManageMembers) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const admin = createAdminClient();
    const { data: existing } = await admin
      .from("team_members")
      .select("*")
      .eq("id", id)
      .eq("team_id", teamContext.team.id)
      .neq("status", "removed")
      .maybeSingle();

    if (!existing) {
      return NextResponse.json({ error: "Member not found." }, { status: 404 });
    }

    if (existing.role === "owner") {
      return NextResponse.json(
        { error: "Cannot remove the team owner." },
        { status: 400 }
      );
    }

    const { error } = await admin
      .from("team_members")
      .update({
        status: "removed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error("Member remove failed:", error);
      return NextResponse.json(
        { error: "Unable to remove member." },
        { status: 500 }
      );
    }

    await logTeamAudit({
      teamId: teamContext.team.id,
      actorUserId: authResult.user.id,
      actorEmail,
      actorRole: teamContext.membership.role,
      action: "member_removed",
      targetType: "team_member",
      targetId: id,
      metadata: { email: existing.email },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Team member DELETE error:", error);
    return NextResponse.json(
      { error: "Unable to remove member." },
      { status: 500 }
    );
  }
}
