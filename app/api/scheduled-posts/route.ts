import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { requireFeatureAccess } from "@/lib/billing/plan-access";
import {
  scheduledPostFromRow,
  summarizeScheduledPosts,
} from "@/lib/social-scheduler/server";
import { validateScheduledPostInput } from "@/lib/social-scheduler/validation";
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

    const { data, error } = await supabase
      .from("scheduled_posts")
      .select("*")
      .eq("user_id", authResult.user.id)
      .order("scheduled_for", { ascending: true });

    if (error) {
      console.error("Scheduled posts fetch failed:", error);
      return NextResponse.json(
        { error: "Unable to load scheduled posts." },
        { status: 500 }
      );
    }

    const posts = (data ?? []).map(scheduledPostFromRow);
    return NextResponse.json({
      posts,
      summary: summarizeScheduledPosts(posts),
    });
  } catch (error) {
    console.error("Scheduled posts fetch error:", error);
    return NextResponse.json(
      { error: "Unable to load scheduled posts." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
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

    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const validation = validateScheduledPostInput(body);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("scheduled_posts")
      .insert({
        user_id: authResult.user.id,
        platform: validation.value.platform,
        caption: validation.value.caption,
        image_data_url: validation.value.imageDataUrl,
        scheduled_for: validation.value.scheduledFor,
        notes: validation.value.notes,
        status: validation.value.status,
        updated_at: now,
      })
      .select("*")
      .single();

    if (error) {
      console.error("Scheduled post create failed:", error);
      return NextResponse.json(
        { error: "Unable to schedule this post." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      post: scheduledPostFromRow(data),
    });
  } catch (error) {
    console.error("Scheduled post create error:", error);
    return NextResponse.json(
      { error: "Unable to schedule this post." },
      { status: 500 }
    );
  }
}
