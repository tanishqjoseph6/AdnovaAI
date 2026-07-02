import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { isUserAdmin } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const authResult = await requireAuthenticatedUser(supabase);
    if ("response" in authResult) {
      return authResult.response;
    }

    return NextResponse.json({
      isAdmin: await isUserAdmin(authResult.user.id),
    });
  } catch (error) {
    console.error("Admin status check failed:", error);
    return NextResponse.json({ isAdmin: false }, { status: 200 });
  }
}
