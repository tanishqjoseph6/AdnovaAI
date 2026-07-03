import type { ProfileRole } from "@/lib/admin/auth";

export type AdminUserRow = {
  id: string;
  email: string | null;
  username: string | null;
  full_name: string | null;
  role: ProfileRole | null;
};

export type AdminUserView = {
  id: string;
  name: string;
  email: string;
  username: string | null;
  role: ProfileRole;
};

export function normalizeProfileRole(role: unknown): ProfileRole {
  return role === "owner" ||
    role === "team_member" ||
    role === "user"
    ? role
    : "user";
}

export function adminUserFromRow(row: AdminUserRow): AdminUserView {
  const email = row.email ?? "";
  return {
    id: row.id,
    name: row.full_name?.trim() || row.username?.trim() || email.split("@")[0] || "Advora user",
    email,
    username: row.username,
    role: normalizeProfileRole(row.role),
  };
}
