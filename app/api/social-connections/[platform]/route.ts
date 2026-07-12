import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { requireFeatureAccess } from "@/lib/billing/plan-access";
import { deleteSocialConnection } from "@/lib/social-scheduler/connections-server";
import { isSocialPlatform } from "@/lib/social-scheduler/types";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ platform: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { platform } = await context.params;

    if (!isSocialPlatform(platform)) {
      return NextResponse.json({ error: "Invalid platform." }, { status: 400 });
    }

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

    await deleteSocialConnection(authResult.user.id, platform);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Social connection delete error:", error);
    return NextResponse.json(
      { error: "Unable to disconnect account." },
      { status: 500 }
    );
  }
}
