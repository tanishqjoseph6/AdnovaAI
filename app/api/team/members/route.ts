import { NextResponse } from "next/server";
import { requireVerifiedUser } from "@/lib/auth/require-user";
import { requireFeatureAccess } from "@/lib/billing/plan-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { canAssignRole } from "@/lib/team-approval/permissions";
import {
  listTeamMembers,
  logTeamAudit,
  memberFromRow,
  notifyTeamUsers,
  requireTeamContext,
} from "@/lib/team-approval/server";
import { isTeamRole, type TeamRole } from "@/lib/team-approval/types";

export async function GET() {
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

    return NextResponse.json({
      success: true,
      members: context.members,
      permissions: context.permissions,
    });
  } catch (error) {
    console.error("Team members GET error:", error);
    return NextResponse.json(
      { error: "Unable to load team members." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
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

    const actorEmail = authResult.user.email;
    if (!actorEmail) {
      return NextResponse.json({ error: "Email required." }, { status: 400 });
    }

    const context = await requireTeamContext({
      userId: authResult.user.id,
      email: actorEmail,
    });

    if (!context.permissions.canManageMembers) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const inviteEmail =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const roleRaw = body.role;
    const role: TeamRole = isTeamRole(roleRaw) ? roleRaw : "editor";

    if (!inviteEmail || !inviteEmail.includes("@")) {
      return NextResponse.json(
        { error: "Enter a valid email address." },
        { status: 400 }
      );
    }

    if (role === "owner") {
      return NextResponse.json(
        { error: "Cannot invite someone as owner." },
        { status: 400 }
      );
    }

    if (!canAssignRole(context.membership.role, role)) {
      return NextResponse.json(
        { error: "You cannot assign that role." },
        { status: 403 }
      );
    }

    const admin = createAdminClient();

    const { data: profile } = await admin
      .from("profiles")
      .select("id, email")
      .ilike("email", inviteEmail)
      .maybeSingle();

    const existingMembers = await listTeamMembers(admin, context.team.id);
    if (
      existingMembers.some(
        (member) => member.email.toLowerCase() === inviteEmail
      )
    ) {
      return NextResponse.json(
        { error: "That email is already on the team." },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();
    const { data: created, error } = await admin
      .from("team_members")
      .insert({
        team_id: context.team.id,
        user_id: profile?.id ?? null,
        email: inviteEmail,
        role,
        status: profile?.id ? "active" : "pending",
        invited_by: authResult.user.id,
        joined_at: profile?.id ? now : null,
      })
      .select("*")
      .single();

    if (error || !created) {
      console.error("Invite member failed:", error);
      return NextResponse.json(
        { error: "Unable to invite this member." },
        { status: 500 }
      );
    }

    const member = memberFromRow(created);

    await logTeamAudit({
      teamId: context.team.id,
      actorUserId: authResult.user.id,
      actorEmail,
      actorRole: context.membership.role,
      action: "member_invited",
      targetType: "team_member",
      targetId: member.id,
      metadata: { email: inviteEmail, role },
    });

    if (member.userId) {
      await notifyTeamUsers({
        userIds: [member.userId],
        title: "You've been added to a team",
        message: `You joined ${context.team.name} as ${role}. Open Team Approvals to collaborate.`,
      });
    }

    return NextResponse.json({ success: true, member }, { status: 201 });
  } catch (error) {
    console.error("Team members POST error:", error);
    return NextResponse.json(
      { error: "Unable to invite this member." },
      { status: 500 }
    );
  }
}
