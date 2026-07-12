import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { requireFeatureAccess } from "@/lib/billing/plan-access";
import { publishScheduledPost } from "@/lib/social-scheduler/publish";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const authResult = await requireAuthenticatedUser(supabase);
    if ("response" in authResult) {
      return authResult.response;
    }

    const featureResult = await requireFeatureAccess(
      supabase,
      authResult.user.id,
      "social_scheduler"
    );
    if ("response" in featureResult) {
      return featureResult.response;
    }

    const admin = createAdminClient();
    const { data: existing, error: existingError } = await admin
      .from("scheduled_posts")
      .select("id, status")
      .eq("id", id)
      .eq("user_id", authResult.user.id)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    if (!existing) {
      return NextResponse.json({ error: "Scheduled post not found." }, { status: 404 });
    }

    if (existing.status !== "failed") {
      return NextResponse.json(
        { error: "Only failed posts can be retried." },
        { status: 400 }
      );
    }

    const { error: resetError } = await admin
      .from("scheduled_posts")
      .update({
        status: "upcoming",
        error_message: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", authResult.user.id);

    if (resetError) {
      throw resetError;
    }

    const post = await publishScheduledPost(id, authResult.user.id);
    return NextResponse.json({ success: true, post });
  } catch (error) {
    console.error("Retry scheduled post error:", error);
    const message =
      error instanceof Error ? error.message : "Unable to retry post.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
