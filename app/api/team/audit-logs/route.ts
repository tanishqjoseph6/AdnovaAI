import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { auditFromRow } from "@/lib/team-approval/server";
import { requireTeamApprovalAuth } from "@/lib/team-approval/api";

export async function GET() {
  try {
    const auth = await requireTeamApprovalAuth();
    if ("response" in auth) return auth.response;

    if (!auth.team.permissions.canViewAudit) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("team_audit_logs")
      .select("*")
      .eq("team_id", auth.team.team.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Team audit logs failed:", error);
      return NextResponse.json(
        { error: "Unable to load audit logs." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      logs: (data ?? []).map((row) => auditFromRow(row)),
    });
  } catch (error) {
    console.error("Team audit GET error:", error);
    return NextResponse.json(
      { error: "Unable to load audit logs." },
      { status: 500 }
    );
  }
}
