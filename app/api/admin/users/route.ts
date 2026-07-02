import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/admin/auth";
import { adminUserFromRow, type AdminUserRow } from "@/lib/admin/users";

export async function GET(request: Request) {
  try {
    const authResult = await requireAdminUser();
    if ("response" in authResult) {
      return authResult.response;
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() ?? "";
    let query = authResult.admin
      .from("profiles")
      .select("id, email, username, full_name, role")
      .order("email", { ascending: true })
      .limit(100);

    if (search) {
      const escaped = search.replace(/[%_]/g, "\\$&");
      query = query.or(
        `email.ilike.%${escaped}%,username.ilike.%${escaped}%,full_name.ilike.%${escaped}%`
      );
    }

    const { data, error } = await query;
    if (error) {
      console.error("Admin users fetch failed:", error);
      return NextResponse.json(
        { error: "Unable to load users." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      users: ((data ?? []) as AdminUserRow[]).map(adminUserFromRow),
      viewerRole: authResult.role,
    });
  } catch (error) {
    console.error("Admin users fetch error:", error);
    return NextResponse.json(
      { error: "Unable to load users." },
      { status: 500 }
    );
  }
}
