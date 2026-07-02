import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import {
  createFeedbackScreenshotSignedUrl,
  feedbackTicketFromRow,
  type FeedbackProfile,
  type FeedbackRow,
} from "@/lib/feedback/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const authResult = await requireAuthenticatedUser(supabase);
    if ("response" in authResult) {
      return authResult.response;
    }

    const { data: rows, error } = await supabase
      .from("user_feedback")
      .select("*")
      .eq("user_id", authResult.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("User feedback fetch failed:", error);
      return NextResponse.json(
        { error: "Unable to load feedback." },
        { status: 500 }
      );
    }

    const profile: FeedbackProfile = {
      id: authResult.user.id,
      email: authResult.user.email ?? null,
      username:
        typeof authResult.user.user_metadata?.username === "string"
          ? authResult.user.user_metadata.username
          : null,
      full_name:
        typeof authResult.user.user_metadata?.full_name === "string"
          ? authResult.user.user_metadata.full_name
          : null,
    };

    const tickets = await Promise.all(
      ((rows ?? []) as FeedbackRow[]).map(async (row) => {
        const screenshotUrl = await createFeedbackScreenshotSignedUrl(
          supabase,
          row.screenshot_url
        );
        return feedbackTicketFromRow(row, profile, screenshotUrl);
      })
    );

    return NextResponse.json({ tickets });
  } catch (error) {
    console.error("User feedback fetch error:", error);
    return NextResponse.json(
      { error: "Unable to load feedback." },
      { status: 500 }
    );
  }
}
