import { NextResponse } from "next/server";
import { requireVerifiedUser } from "@/lib/auth/require-user";
import { requireFeatureAccess } from "@/lib/billing/plan-access";
import { requireTeamContext } from "@/lib/team-approval/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const authResult = await requireVerifiedUser(supabase);
    if ("response" in authResult) return authResult.response;

    const featureResult = await requireFeatureAccess(
      supabase,
      authResult.user.id,
      "social_scheduler"
    );
    if ("response" in featureResult) return featureResult.response;

    const email = authResult.user.email;
    if (!email) {
      return NextResponse.json(
        { error: "Your account needs an email address." },
        { status: 400 }
      );
    }

    const context = await requireTeamContext({
      userId: authResult.user.id,
      email,
    });

    return NextResponse.json({
      success: true,
      team: context.team,
      membership: context.membership,
      members: context.members,
      permissions: context.permissions,
    });
  } catch (error) {
    console.error("Team GET error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to load team workspace.",
      },
      { status: 500 }
    );
  }
}
