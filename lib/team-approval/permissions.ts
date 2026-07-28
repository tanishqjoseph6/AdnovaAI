import type { TeamPermissions, TeamRole } from "@/lib/team-approval/types";

const ROLE_RANK: Record<TeamRole, number> = {
  editor: 1,
  manager: 2,
  admin: 3,
  owner: 4,
};

export function roleAtLeast(role: TeamRole, minimum: TeamRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minimum];
}

export function getPermissionsForRole(role: TeamRole): TeamPermissions {
  return {
    canSubmit: roleAtLeast(role, "editor"),
    canApprove: roleAtLeast(role, "manager"),
    canReject: roleAtLeast(role, "manager"),
    canSchedule: roleAtLeast(role, "manager"),
    canComment: roleAtLeast(role, "editor"),
    canManageMembers: roleAtLeast(role, "admin"),
    canViewAudit: roleAtLeast(role, "admin"),
    canEditAny: roleAtLeast(role, "manager"),
  };
}

export function canAssignRole(actorRole: TeamRole, targetRole: TeamRole): boolean {
  if (targetRole === "owner") return false;
  if (actorRole === "owner") return true;
  if (actorRole === "admin") {
    return targetRole === "manager" || targetRole === "editor";
  }
  return false;
}
