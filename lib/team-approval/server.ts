import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPermissionsForRole } from "@/lib/team-approval/permissions";
import type {
  ApprovalActivity,
  ApprovalActivityAction,
  ApprovalComment,
  Team,
  TeamAuditLog,
  TeamContext,
  TeamMember,
  TeamRole,
} from "@/lib/team-approval/types";
import { isTeamRole } from "@/lib/team-approval/types";

type TeamRow = {
  id: string;
  owner_user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

type MemberRow = {
  id: string;
  team_id: string;
  user_id: string | null;
  email: string;
  role: string;
  status: string;
  invited_by: string | null;
  joined_at: string | null;
  created_at: string;
  updated_at: string;
};

type CommentRow = {
  id: string;
  team_id: string;
  post_id: string;
  author_user_id: string;
  author_email: string;
  author_role: string;
  body: string;
  created_at: string;
};

type ActivityRow = {
  id: string;
  team_id: string;
  post_id: string;
  actor_user_id: string | null;
  actor_email: string | null;
  actor_role: string | null;
  action: string;
  message: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

type AuditRow = {
  id: string;
  team_id: string;
  actor_user_id: string | null;
  actor_email: string | null;
  actor_role: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export function teamFromRow(row: TeamRow): Team {
  return {
    id: row.id,
    ownerUserId: row.owner_user_id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function memberFromRow(row: MemberRow): TeamMember {
  return {
    id: row.id,
    teamId: row.team_id,
    userId: row.user_id,
    email: row.email,
    role: (isTeamRole(row.role) ? row.role : "editor") as TeamRole,
    status: row.status as TeamMember["status"],
    invitedBy: row.invited_by,
    joinedAt: row.joined_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function commentFromRow(row: CommentRow): ApprovalComment {
  return {
    id: row.id,
    teamId: row.team_id,
    postId: row.post_id,
    authorUserId: row.author_user_id,
    authorEmail: row.author_email,
    authorRole: (isTeamRole(row.author_role) ? row.author_role : "editor") as TeamRole,
    body: row.body,
    createdAt: row.created_at,
  };
}

export function activityFromRow(row: ActivityRow): ApprovalActivity {
  return {
    id: row.id,
    teamId: row.team_id,
    postId: row.post_id,
    actorUserId: row.actor_user_id,
    actorEmail: row.actor_email,
    actorRole: isTeamRole(row.actor_role) ? row.actor_role : null,
    action: row.action as ApprovalActivityAction,
    message: row.message,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
  };
}

export function auditFromRow(row: AuditRow): TeamAuditLog {
  return {
    id: row.id,
    teamId: row.team_id,
    actorUserId: row.actor_user_id,
    actorEmail: row.actor_email,
    actorRole: isTeamRole(row.actor_role) ? row.actor_role : null,
    action: row.action,
    targetType: row.target_type,
    targetId: row.target_id,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
  };
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Ensure the user has a personal team and an owner membership. */
export async function ensurePersonalTeam(input: {
  userId: string;
  email: string;
  displayName?: string | null;
}): Promise<TeamContext> {
  const admin = createAdminClient();
  const email = normalizeEmail(input.email);

  const { data: membership } = await admin
    .from("team_members")
    .select("*")
    .eq("user_id", input.userId)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (membership) {
    const { data: team, error: teamError } = await admin
      .from("teams")
      .select("*")
      .eq("id", membership.team_id)
      .single();

    if (teamError || !team) {
      throw new Error("Unable to load your team.");
    }

    const members = await listTeamMembers(admin, team.id);
    const member = memberFromRow(membership as MemberRow);
    return {
      team: teamFromRow(team as TeamRow),
      membership: member,
      members,
      permissions: getPermissionsForRole(member.role),
    };
  }

  const teamName =
    (input.displayName?.trim() || email.split("@")[0] || "My Team").slice(0, 80) +
    "'s Workspace";

  const { data: team, error: createError } = await admin
    .from("teams")
    .insert({
      owner_user_id: input.userId,
      name: teamName.slice(0, 80),
    })
    .select("*")
    .single();

  if (createError || !team) {
    // Race: another request may have created the team.
    const { data: existing } = await admin
      .from("teams")
      .select("*")
      .eq("owner_user_id", input.userId)
      .maybeSingle();

    if (!existing) {
      console.error("Team create failed:", createError);
      throw new Error("Unable to create your team workspace.");
    }

    return ensurePersonalTeam(input);
  }

  const now = new Date().toISOString();
  const { data: ownerMember, error: memberError } = await admin
    .from("team_members")
    .insert({
      team_id: team.id,
      user_id: input.userId,
      email,
      role: "owner",
      status: "active",
      invited_by: input.userId,
      joined_at: now,
    })
    .select("*")
    .single();

  if (memberError || !ownerMember) {
    console.error("Owner membership create failed:", memberError);
    throw new Error("Unable to initialize team membership.");
  }

  const members = [memberFromRow(ownerMember as MemberRow)];
  return {
    team: teamFromRow(team as TeamRow),
    membership: members[0],
    members,
    permissions: getPermissionsForRole("owner"),
  };
}

export async function listTeamMembers(
  admin: SupabaseClient,
  teamId: string
): Promise<TeamMember[]> {
  const { data, error } = await admin
    .from("team_members")
    .select("*")
    .eq("team_id", teamId)
    .neq("status", "removed")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("List team members failed:", error);
    throw new Error("Unable to load team members.");
  }

  return (data ?? []).map((row) => memberFromRow(row as MemberRow));
}

export async function requireTeamContext(input: {
  userId: string;
  email: string;
}): Promise<TeamContext> {
  return ensurePersonalTeam(input);
}

export async function logApprovalActivity(input: {
  teamId: string;
  postId: string;
  actorUserId: string | null;
  actorEmail: string | null;
  actorRole: TeamRole | null;
  action: ApprovalActivityAction;
  message?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const admin = createAdminClient();
  const { error } = await admin.from("approval_activity").insert({
    team_id: input.teamId,
    post_id: input.postId,
    actor_user_id: input.actorUserId,
    actor_email: input.actorEmail,
    actor_role: input.actorRole,
    action: input.action,
    message: input.message ?? null,
    metadata: input.metadata ?? {},
  });

  if (error) {
    console.error("Approval activity write failed:", error);
  }
}

export async function logTeamAudit(input: {
  teamId: string;
  actorUserId: string | null;
  actorEmail: string | null;
  actorRole: TeamRole | null;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}) {
  const admin = createAdminClient();
  const { error } = await admin.from("team_audit_logs").insert({
    team_id: input.teamId,
    actor_user_id: input.actorUserId,
    actor_email: input.actorEmail,
    actor_role: input.actorRole,
    action: input.action,
    target_type: input.targetType ?? null,
    target_id: input.targetId ?? null,
    metadata: input.metadata ?? {},
  });

  if (error) {
    console.error("Team audit log write failed:", error);
  }
}

export async function notifyTeamUsers(input: {
  userIds: string[];
  title: string;
  message: string;
}) {
  const unique = Array.from(new Set(input.userIds.filter(Boolean)));
  if (unique.length === 0) return;

  const admin = createAdminClient();
  const rows = unique.map((userId) => ({
    user_id: userId,
    title: input.title.slice(0, 120),
    message: input.message.slice(0, 500),
    is_read: false,
  }));

  const { error } = await admin.from("notifications").insert(rows);
  if (error) {
    console.error("Team notification insert failed:", error);
  }
}

export async function listApproverUserIds(
  admin: SupabaseClient,
  teamId: string
): Promise<string[]> {
  const { data, error } = await admin
    .from("team_members")
    .select("user_id, role")
    .eq("team_id", teamId)
    .eq("status", "active")
    .in("role", ["owner", "admin", "manager"]);

  if (error) {
    console.error("List approvers failed:", error);
    return [];
  }

  return (data ?? [])
    .map((row) => row.user_id as string | null)
    .filter((id): id is string => Boolean(id));
}
