import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { requireFeatureAccess } from "@/lib/billing/plan-access";
import { publishScheduledPost } from "@/lib/social-scheduler/publish";
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

    const post = await publishScheduledPost(id, authResult.user.id);
    return NextResponse.json({ success: true, post });
  } catch (error) {
    console.error("Publish scheduled post error:", error);
    const message =
      error instanceof Error ? error.message : "Unable to publish post.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
