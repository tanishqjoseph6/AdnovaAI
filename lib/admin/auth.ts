import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type AdminAuthSuccess = {
  user: User;
  admin: ReturnType<typeof createAdminClient>;
};

export async function isUserAdmin(userId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("is_admin")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("Admin lookup failed:", error);
    return false;
  }

  return data?.is_admin === true;
}

export async function requireAdminUser(): Promise<
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
    .select("is_admin")
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

  if (data?.is_admin !== true) {
    return {
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { user: authResult.user, admin };
}
