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
      .select("id, email, username, full_name, role, plan, subscription_status, account_status, created_at")
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

    const rows = (data ?? []) as AdminUserRow[];
    const userIds = rows.map((row) => row.id);
    const [{ data: creditsRows }, authUsersResult] = await Promise.all([
      userIds.length > 0
        ? authResult.admin
            .from("user_credits")
            .select("user_id, credits")
            .in("user_id", userIds)
        : Promise.resolve({ data: [] as Array<{ user_id: string; credits: number }>, error: null }),
      authResult.admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    ]);

    const creditsMap = new Map(
      ((creditsRows ?? []) as Array<{ user_id: string; credits: number }>).map(
        (row) => [row.user_id, row.credits]
      )
    );
    const lastLoginMap = new Map(
      (authUsersResult.data?.users ?? []).map((user) => [
        user.id,
        user.last_sign_in_at ?? null,
      ])
    );

    return NextResponse.json({
      users: rows.map((row) =>
        adminUserFromRow(row, {
          credits: creditsMap.get(row.id) ?? null,
          lastLoginAt: lastLoginMap.get(row.id) ?? null,
        })
      ),
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
