import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { requireFeatureAccess } from "@/lib/billing/plan-access";
import { scheduledPostFromRow } from "@/lib/social-scheduler/server";
import { validateScheduledPostInput } from "@/lib/social-scheduler/validation";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
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

    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const validation = validateScheduledPostInput(body, { allowStatus: true });
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("scheduled_posts")
      .update({
        platform: validation.value.platform,
        caption: validation.value.caption,
        image_data_url: validation.value.imageDataUrl,
        scheduled_for: validation.value.scheduledFor,
        notes: validation.value.notes,
        status: validation.value.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", authResult.user.id)
      .select("*")
      .maybeSingle();

    if (error) {
      console.error("Scheduled post update failed:", error);
      return NextResponse.json(
        { error: "Unable to update this scheduled post." },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Scheduled post not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      post: scheduledPostFromRow(data),
    });
  } catch (error) {
    console.error("Scheduled post update error:", error);
    return NextResponse.json(
      { error: "Unable to update this scheduled post." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
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

    const { error } = await supabase
      .from("scheduled_posts")
      .delete()
      .eq("id", id)
      .eq("user_id", authResult.user.id);

    if (error) {
      console.error("Scheduled post delete failed:", error);
      return NextResponse.json(
        { error: "Unable to delete this scheduled post." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Scheduled post delete error:", error);
    return NextResponse.json(
      { error: "Unable to delete this scheduled post." },
      { status: 500 }
    );
  }
}
