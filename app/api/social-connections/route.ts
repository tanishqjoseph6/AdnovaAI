import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { requireFeatureAccess } from "@/lib/billing/plan-access";
import { listSocialConnections } from "@/lib/social-scheduler/connections-server";
import { getSocialOAuthStatus } from "@/lib/social-scheduler/oauth-config";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
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

    const oauth = getSocialOAuthStatus();

    try {
      const connections = await listSocialConnections(authResult.user.id);
      return NextResponse.json({ connections, oauth });
    } catch (error) {
      console.error("Social connections fetch error:", error);
      return NextResponse.json({ connections: [], oauth });
    }
  } catch (error) {
    console.error("Social connections route error:", error);
    return NextResponse.json({
      connections: [],
      oauth: getSocialOAuthStatus(),
    });
  }
}
