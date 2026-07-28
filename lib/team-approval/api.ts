import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { requireVerifiedUser } from "@/lib/auth/require-user";
import { requireFeatureAccess } from "@/lib/billing/plan-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { ScheduledPostRow } from "@/lib/social-scheduler/server";
import { requireTeamContext } from "@/lib/team-approval/server";
import type { TeamContext } from "@/lib/team-approval/types";

export type TeamAuthSuccess = {
  user: User;
  email: string;
  team: TeamContext;
};

export async function requireTeamApprovalAuth(): Promise<
  TeamAuthSuccess | { response: NextResponse }
> {
  const supabase = await createClient();
  const authResult = await requireVerifiedUser(supabase);
  if ("response" in authResult) {
    return { response: authResult.response };
  }

  const featureResult = await requireFeatureAccess(
    supabase,
    authResult.user.id,
    "social_scheduler"
  );
  if ("response" in featureResult) {
    return { response: featureResult.response };
  }

  const email = authResult.user.email;
  if (!email) {
    return {
      response: NextResponse.json({ error: "Email required." }, { status: 400 }),
    };
  }

  const team = await requireTeamContext({
    userId: authResult.user.id,
    email,
  });

  return { user: authResult.user, email, team };
}

export async function loadAccessiblePost(
  postId: string,
  team: TeamContext,
  userId: string
) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("scheduled_posts")
    .select("*")
    .eq("id", postId)
    .maybeSingle();

  if (error || !data) {
    return {
      error: NextResponse.json({ error: "Post not found." }, { status: 404 }),
    };
  }

  const belongsToTeam = data.team_id === team.team.id;
  const belongsToUser = data.user_id === userId && !data.team_id;
  if (!belongsToTeam && !belongsToUser) {
    return {
      error: NextResponse.json({ error: "Forbidden." }, { status: 403 }),
    };
  }

  return {
    admin,
    row: data as ScheduledPostRow & {
      user_id: string;
      team_id: string | null;
      submitted_by: string | null;
    },
  };
}
