export const TEAM_ROLES = ["owner", "admin", "manager", "editor"] as const;
export type TeamRole = (typeof TEAM_ROLES)[number];

export const TEAM_MEMBER_STATUSES = ["pending", "active", "removed"] as const;
export type TeamMemberStatus = (typeof TEAM_MEMBER_STATUSES)[number];

export const APPROVAL_WORKFLOW_STATUSES = [
  "draft",
  "pending_approval",
  "approved",
  "upcoming",
  "published",
  "failed",
  "rejected",
] as const;

export type ApprovalWorkflowStatus = (typeof APPROVAL_WORKFLOW_STATUSES)[number];

export const APPROVAL_ACTIVITY_ACTIONS = [
  "created",
  "submitted",
  "approved",
  "rejected",
  "scheduled",
  "published",
  "commented",
  "resubmitted",
  "edited",
] as const;

export type ApprovalActivityAction = (typeof APPROVAL_ACTIVITY_ACTIONS)[number];

export const APPROVAL_STATUS_LABELS: Record<ApprovalWorkflowStatus, string> = {
  draft: "Draft",
  pending_approval: "Pending Approval",
  approved: "Approved",
  upcoming: "Scheduled",
  published: "Published",
  failed: "Failed",
  rejected: "Rejected",
};

export const TEAM_ROLE_LABELS: Record<TeamRole, string> = {
  owner: "Owner",
  admin: "Admin",
  manager: "Manager",
  editor: "Editor",
};

export type Team = {
  id: string;
  ownerUserId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type TeamMember = {
  id: string;
  teamId: string;
  userId: string | null;
  email: string;
  role: TeamRole;
  status: TeamMemberStatus;
  invitedBy: string | null;
  joinedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ApprovalComment = {
  id: string;
  teamId: string;
  postId: string;
  authorUserId: string;
  authorEmail: string;
  authorRole: TeamRole;
  body: string;
  createdAt: string;
};

export type ApprovalActivity = {
  id: string;
  teamId: string;
  postId: string;
  actorUserId: string | null;
  actorEmail: string | null;
  actorRole: TeamRole | null;
  action: ApprovalActivityAction;
  message: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type TeamAuditLog = {
  id: string;
  teamId: string;
  actorUserId: string | null;
  actorEmail: string | null;
  actorRole: TeamRole | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type TeamDashboardSummary = {
  draft: number;
  pendingApproval: number;
  approved: number;
  scheduled: number;
  published: number;
  rejected: number;
  failed: number;
  members: number;
};

export type TeamContext = {
  team: Team;
  membership: TeamMember;
  members: TeamMember[];
  permissions: TeamPermissions;
};

export type TeamPermissions = {
  canSubmit: boolean;
  canApprove: boolean;
  canReject: boolean;
  canSchedule: boolean;
  canComment: boolean;
  canManageMembers: boolean;
  canViewAudit: boolean;
  canEditAny: boolean;
};

export function isTeamRole(value: unknown): value is TeamRole {
  return typeof value === "string" && TEAM_ROLES.includes(value as TeamRole);
}

export function isApprovalWorkflowStatus(
  value: unknown
): value is ApprovalWorkflowStatus {
  return (
    typeof value === "string" &&
    APPROVAL_WORKFLOW_STATUSES.includes(value as ApprovalWorkflowStatus)
  );
}
