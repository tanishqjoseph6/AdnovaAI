import { NextResponse } from "next/server";
import { requireVerifiedUser } from "@/lib/auth/require-user";
import { requireFeatureAccess } from "@/lib/billing/plan-access";
import { scheduledPostFromRow } from "@/lib/social-scheduler/server";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const authResult = await requireVerifiedUser(supabase);
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

    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;

    const { data: existing, error: existingError } = await supabase
      .from("scheduled_posts")
      .select("*")
      .eq("id", id)
      .eq("user_id", authResult.user.id)
      .maybeSingle();

    if (existingError) {
      console.error("Duplicate lookup failed:", existingError);
      return NextResponse.json(
        { error: "Unable to duplicate this post." },
        { status: 500 }
      );
    }

    if (!existing) {
      return NextResponse.json(
        { error: "Scheduled post not found." },
        { status: 404 }
      );
    }

    const scheduledFor =
      typeof body.scheduledFor === "string"
        ? new Date(body.scheduledFor)
        : new Date(new Date(existing.scheduled_for).getTime() + 60 * 60 * 1000);

    if (Number.isNaN(scheduledFor.getTime())) {
      return NextResponse.json(
        { error: "Choose a valid date and time." },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("scheduled_posts")
      .insert({
        user_id: authResult.user.id,
        platform: existing.platform,
        caption: existing.caption,
        image_data_url: existing.image_data_url,
        image_url: existing.image_url,
        image_storage_path: existing.image_storage_path,
        scheduled_for: scheduledFor.toISOString(),
        notes: existing.notes,
        status: existing.status === "published" ? "upcoming" : existing.status === "failed" ? "upcoming" : existing.status,
        campaign_id: existing.campaign_id ?? null,
        campaign_color: existing.campaign_color ?? null,
        created_at: now,
        updated_at: now,
      })
      .select("*")
      .single();

    if (error) {
      console.error("Duplicate insert failed:", error);
      return NextResponse.json(
        { error: "Unable to duplicate this post." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      post: scheduledPostFromRow(data),
    });
  } catch (error) {
    console.error("Duplicate post error:", error);
    return NextResponse.json(
      { error: "Unable to duplicate this post." },
      { status: 500 }
    );
  }
}
