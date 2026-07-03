import type { ProfileRole } from "@/lib/admin/auth";

export type AdminUserRow = {
  id: string;
  email: string | null;
  username: string | null;
  full_name: string | null;
  role: ProfileRole | null;
  plan?: string | null;
  subscription_status?: string | null;
  account_status?: string | null;
  created_at?: string | null;
};

export type AdminUserView = {
  id: string;
  name: string;
  email: string;
  username: string | null;
  role: ProfileRole;
  plan: string;
  credits: number | null;
  status: "active" | "suspended" | "deleted";
  joinedAt: string | null;
  lastLoginAt: string | null;
};

export function normalizeProfileRole(role: unknown): ProfileRole {
  return role === "owner" ||
    role === "team_member" ||
    role === "user"
    ? role
    : "user";
}

export function adminUserFromRow(
  row: AdminUserRow,
  options: { credits?: number | null; lastLoginAt?: string | null } = {}
): AdminUserView {
  const email = row.email ?? "";
  const status =
    row.account_status === "suspended" || row.account_status === "deleted"
      ? row.account_status
      : "active";
  return {
    id: row.id,
    name: row.full_name?.trim() || row.username?.trim() || email.split("@")[0] || "Advora user",
    email,
    username: row.username,
    role: normalizeProfileRole(row.role),
    plan: row.plan ?? "free",
    credits: options.credits ?? null,
    status,
    joinedAt: row.created_at ?? null,
    lastLoginAt: options.lastLoginAt ?? null,
  };
}
