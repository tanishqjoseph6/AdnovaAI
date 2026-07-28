import { NextResponse } from "next/server";
import { requireVerifiedUser } from "@/lib/auth/require-user";
import { requireFeatureAccess } from "@/lib/billing/plan-access";
import { scheduledPostFromRow } from "@/lib/social-scheduler/server";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
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
    const scheduledFor =
      typeof body.scheduledFor === "string" ? body.scheduledFor : "";
    const scheduledDate = new Date(scheduledFor);

    if (!scheduledFor || Number.isNaN(scheduledDate.getTime())) {
      return NextResponse.json(
        { error: "Choose a valid date and time." },
        { status: 400 }
      );
    }

    const { data: existing, error: existingError } = await supabase
      .from("scheduled_posts")
      .select("*")
      .eq("id", id)
      .eq("user_id", authResult.user.id)
      .maybeSingle();

    if (existingError) {
      console.error("Reschedule lookup failed:", existingError);
      return NextResponse.json(
        { error: "Unable to reschedule this post." },
        { status: 500 }
      );
    }

    if (!existing) {
      return NextResponse.json(
        { error: "Scheduled post not found." },
        { status: 404 }
      );
    }

    if (existing.status === "published") {
      return NextResponse.json(
        { error: "Published posts cannot be rescheduled." },
        { status: 400 }
      );
    }

    const nextStatus =
      existing.status === "draft"
        ? "draft"
        : existing.status === "failed"
          ? "upcoming"
          : existing.status;

    const { data, error } = await supabase
      .from("scheduled_posts")
      .update({
        scheduled_for: scheduledDate.toISOString(),
        status: nextStatus,
        error_message: nextStatus === "upcoming" ? null : existing.error_message,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", authResult.user.id)
      .select("*")
      .maybeSingle();

    if (error || !data) {
      console.error("Reschedule update failed:", error);
      return NextResponse.json(
        { error: "Unable to reschedule this post." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      post: scheduledPostFromRow(data),
    });
  } catch (error) {
    console.error("Reschedule error:", error);
    return NextResponse.json(
      { error: "Unable to reschedule this post." },
      { status: 500 }
    );
  }
}
