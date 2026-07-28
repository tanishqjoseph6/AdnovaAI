import type {
  ApprovalActivity,
  ApprovalComment,
  Team,
  TeamAuditLog,
  TeamDashboardSummary,
  TeamMember,
  TeamPermissions,
  TeamRole,
} from "@/lib/team-approval/types";
import type { ScheduledPost } from "@/lib/social-scheduler/types";

async function parseJson<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => ({}))) as T & {
    error?: string;
  };
  if (!response.ok) {
    throw new Error(
      typeof payload.error === "string" ? payload.error : "Request failed."
    );
  }
  return payload;
}

export async function fetchTeamDashboard(): Promise<{
  summary: TeamDashboardSummary;
  team: Team;
  membership: TeamMember;
  permissions: TeamPermissions;
  members: TeamMember[];
}> {
  const response = await fetch("/api/team/dashboard", { cache: "no-store" });
  return parseJson(response);
}

export async function fetchApprovals(options?: {
  status?: string;
  search?: string;
}): Promise<{
  posts: ScheduledPost[];
  permissions: TeamPermissions;
  team: Team;
}> {
  const params = new URLSearchParams();
  if (options?.status) params.set("status", options.status);
  if (options?.search) params.set("search", options.search);
  const query = params.toString();
  const response = await fetch(
    `/api/team/approvals${query ? `?${query}` : ""}`,
    { cache: "no-store" }
  );
  return parseJson(response);
}

export async function submitForApproval(postId: string): Promise<ScheduledPost> {
  const response = await fetch(`/api/team/approvals/${postId}/submit`, {
    method: "POST",
  });
  const payload = await parseJson<{ post: ScheduledPost }>(response);
  return payload.post;
}

export async function approvePost(postId: string): Promise<ScheduledPost> {
  const response = await fetch(`/api/team/approvals/${postId}/approve`, {
    method: "POST",
  });
  const payload = await parseJson<{ post: ScheduledPost }>(response);
  return payload.post;
}

export async function rejectPost(
  postId: string,
  reason: string
): Promise<ScheduledPost> {
  const response = await fetch(`/api/team/approvals/${postId}/reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });
  const payload = await parseJson<{ post: ScheduledPost }>(response);
  return payload.post;
}

export async function scheduleApprovedPost(
  postId: string,
  scheduledFor?: string
): Promise<ScheduledPost> {
  const response = await fetch(`/api/team/approvals/${postId}/schedule`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(scheduledFor ? { scheduledFor } : {}),
  });
  const payload = await parseJson<{ post: ScheduledPost }>(response);
  return payload.post;
}

export async function fetchComments(postId: string): Promise<ApprovalComment[]> {
  const response = await fetch(`/api/team/approvals/${postId}/comments`, {
    cache: "no-store",
  });
  const payload = await parseJson<{ comments: ApprovalComment[] }>(response);
  return payload.comments;
}

export async function addComment(
  postId: string,
  body: string
): Promise<ApprovalComment> {
  const response = await fetch(`/api/team/approvals/${postId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body }),
  });
  const payload = await parseJson<{ comment: ApprovalComment }>(response);
  return payload.comment;
}

export async function fetchActivity(
  postId: string
): Promise<ApprovalActivity[]> {
  const response = await fetch(`/api/team/approvals/${postId}/activity`, {
    cache: "no-store",
  });
  const payload = await parseJson<{ activity: ApprovalActivity[] }>(response);
  return payload.activity;
}

export async function inviteTeamMember(input: {
  email: string;
  role: Exclude<TeamRole, "owner">;
}): Promise<TeamMember> {
  const response = await fetch("/api/team/members", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const payload = await parseJson<{ member: TeamMember }>(response);
  return payload.member;
}

export async function updateTeamMemberRole(
  memberId: string,
  role: Exclude<TeamRole, "owner">
): Promise<TeamMember> {
  const response = await fetch(`/api/team/members/${memberId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  });
  const payload = await parseJson<{ member: TeamMember }>(response);
  return payload.member;
}

export async function removeTeamMember(memberId: string): Promise<void> {
  const response = await fetch(`/api/team/members/${memberId}`, {
    method: "DELETE",
  });
  await parseJson(response);
}

export async function fetchTeamAuditLogs(): Promise<TeamAuditLog[]> {
  const response = await fetch("/api/team/audit-logs", { cache: "no-store" });
  const payload = await parseJson<{ logs: TeamAuditLog[] }>(response);
  return payload.logs;
}
