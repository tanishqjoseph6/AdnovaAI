import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type AdminAuthSuccess = {
  user: User;
  admin: ReturnType<typeof createAdminClient>;
  role: AdminRole;
};

export type AdminRole = "owner" | "team_member";
export type ProfileRole = AdminRole | "user";

export const OWNER_EMAIL = "richietanishq@gmail.com";

export function normalizeEmail(email: string | null | undefined): string {
  return email?.trim().toLowerCase() ?? "";
}

export function isOwnerEmail(email: string | null | undefined): boolean {
  return normalizeEmail(email) === OWNER_EMAIL;
}

export function isAdminRole(role: string | null | undefined): role is AdminRole {
  return role === "owner" || role === "team_member";
}

export async function getUserRole(
  userId: string,
  email?: string | null
): Promise<ProfileRole> {
  if (isOwnerEmail(email)) {
    return "owner";
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("role, is_admin")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("Role lookup failed:", {
      userId,
      email: normalizeEmail(email),
      code: error.code,
      message: error.message,
      details: error.details,
    });
    return "user";
  }

  if (data?.role === "team_member") return "team_member";
  if (data?.is_admin === true) return "team_member";
  return "user";
}

export async function isUserAdmin(
  userId: string,
  email?: string | null
): Promise<boolean> {
  return isAdminRole(await getUserRole(userId, email));
}

export async function isUserOwner(
  userId: string,
  email?: string | null
): Promise<boolean> {
  return (await getUserRole(userId, email)) === "owner";
}

export async function requireAdminUser(options: { ownerOnly?: boolean } = {}): Promise<
  AdminAuthSuccess | { response: NextResponse }
> {
  const supabase = await createClient();
  const authResult = await requireAuthenticatedUser(supabase);
  if ("response" in authResult) {
    return authResult;
  }

  const role = await getUserRole(authResult.user.id, authResult.user.email);
  const canAccessAdmin = isAdminRole(role);

  if (!canAccessAdmin || (options.ownerOnly && role !== "owner")) {
    console.warn("Admin authorization denied:", {
      userId: authResult.user.id,
      email: normalizeEmail(authResult.user.email),
      role,
      ownerOnly: options.ownerOnly === true,
    });
    return {
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  const admin = createAdminClient();

  return { user: authResult.user, admin, role };
}
