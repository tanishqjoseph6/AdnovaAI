import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/admin/auth";

export async function GET() {
  try {
    const authResult = await requireAdminUser({ ownerOnly: true });
    if ("response" in authResult) return authResult.response;

    const { data, error } = await authResult.admin
      .from("admin_audit_logs")
      .select("id, admin_email, action, target_type, target_id, metadata, created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;
    return NextResponse.json({ logs: data ?? [] });
  } catch (error) {
    console.error("Admin audit logs fetch error:", error);
    return NextResponse.json(
      { error: "Unable to load audit logs." },
      { status: 500 }
    );
  }
}
