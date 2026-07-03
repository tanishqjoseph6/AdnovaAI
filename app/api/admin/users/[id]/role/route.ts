import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/admin/auth";
import {
  adminUserFromRow,
  normalizeProfileRole,
  type AdminUserRow,
} from "@/lib/admin/users";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const authResult = await requireAdminUser({ ownerOnly: true });
    if ("response" in authResult) {
      return authResult.response;
    }

    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as {
      role?: unknown;
    };
    if (
      body.role !== "user" &&
      body.role !== "team_member"
    ) {
      return NextResponse.json(
        { error: "Role must be user or team_member." },
        { status: 400 }
      );
    }
    const nextRole = body.role;

    const { data: existing, error: existingError } = await authResult.admin
      .from("profiles")
      .select("id, email, username, full_name, role")
      .eq("id", id)
      .single();

    if (existingError || !existing) {
      console.error("Admin role target lookup failed:", existingError);
      return NextResponse.json(
        { error: "User not found." },
        { status: existingError?.code === "PGRST116" ? 404 : 500 }
      );
    }

    const currentRole = normalizeProfileRole((existing as AdminUserRow).role);
    if (currentRole === "owner") {
      return NextResponse.json(
        { error: "Owner role cannot be changed." },
        { status: 403 }
      );
    }

    const { data, error } = await authResult.admin
      .from("profiles")
      .update({
        role: nextRole,
        is_admin: nextRole === "team_member",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("id, email, username, full_name, role")
      .single();

    if (error || !data) {
      console.error("Admin role update failed:", error);
      return NextResponse.json(
        { error: "Unable to update user role." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: adminUserFromRow(data as AdminUserRow),
    });
  } catch (error) {
    console.error("Admin role update error:", error);
    return NextResponse.json(
      { error: "Unable to update user role." },
      { status: 500 }
    );
  }
}
