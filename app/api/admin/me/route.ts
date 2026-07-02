import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { getUserRole, isAdminRole } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const authResult = await requireAuthenticatedUser(supabase);
    if ("response" in authResult) {
      return authResult.response;
    }

    const role = await getUserRole(authResult.user.id);
    return NextResponse.json({
      role,
      isAdmin: isAdminRole(role),
      isOwner: role === "owner",
    });
  } catch (error) {
    console.error("Admin status check failed:", error);
    return NextResponse.json(
      { role: "user", isAdmin: false, isOwner: false },
      { status: 200 }
    );
  }
}
