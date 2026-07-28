import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { activityFromRow } from "@/lib/team-approval/server";
import {
  loadAccessiblePost,
  requireTeamApprovalAuth,
} from "@/lib/team-approval/api";

type RouteContext = {
  params: Promise<{ postId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { postId } = await context.params;
    const auth = await requireTeamApprovalAuth();
    if ("response" in auth) return auth.response;

    const loaded = await loadAccessiblePost(postId, auth.team, auth.user.id);
    if ("error" in loaded) return loaded.error;

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("approval_activity")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Activity list failed:", error);
      return NextResponse.json(
        { error: "Unable to load activity timeline." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      activity: (data ?? []).map((row) => activityFromRow(row)),
    });
  } catch (error) {
    console.error("Activity GET error:", error);
    return NextResponse.json(
      { error: "Unable to load activity timeline." },
      { status: 500 }
    );
  }
}
