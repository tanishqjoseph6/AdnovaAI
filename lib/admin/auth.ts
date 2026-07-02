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

export type AdminRole = "owner" | "admin";
export type ProfileRole = AdminRole | "user";

export function isAdminRole(role: string | null | undefined): role is AdminRole {
  return role === "owner" || role === "admin";
}

export async function getUserRole(userId: string): Promise<ProfileRole> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("role, is_admin")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("Role lookup failed:", error);
    return "user";
  }

  if (data?.role === "owner" || data?.role === "admin" || data?.role === "user") {
    return data.role;
  }

  return data?.is_admin === true ? "admin" : "user";
}

export async function isUserAdmin(userId: string): Promise<boolean> {
  return isAdminRole(await getUserRole(userId));
}

export async function isUserOwner(userId: string): Promise<boolean> {
  return (await getUserRole(userId)) === "owner";
}

export async function requireAdminUser(options: { ownerOnly?: boolean } = {}): Promise<
  AdminAuthSuccess | { response: NextResponse }
> {
  const supabase = await createClient();
  const authResult = await requireAuthenticatedUser(supabase);
  if ("response" in authResult) {
    return authResult;
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("role, is_admin")
    .eq("id", authResult.user.id)
    .maybeSingle();

  if (error) {
    console.error("Admin auth lookup failed:", error);
    return {
      response: NextResponse.json(
        { error: "Unable to verify admin access." },
        { status: 500 }
      ),
    };
  }

  const role =
    data?.role === "owner" || data?.role === "admin" || data?.role === "user"
      ? data.role
      : data?.is_admin === true
        ? "admin"
        : "user";

  if (!isAdminRole(role) || (options.ownerOnly && role !== "owner")) {
    return {
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { user: authResult.user, admin, role };
}
