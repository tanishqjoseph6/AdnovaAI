import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/admin/auth";
import {
  createFeedbackScreenshotSignedUrl,
  feedbackTicketFromRow,
  type FeedbackProfile,
  type FeedbackRow,
} from "@/lib/feedback/server";

export async function GET() {
  try {
    const authResult = await requireAdminUser();
    if ("response" in authResult) {
      return authResult.response;
    }

    const { admin } = authResult;
    const { data: feedbackRows, error: feedbackError } = await admin
      .from("user_feedback")
      .select("*")
      .order("created_at", { ascending: false });

    if (feedbackError) {
      console.error("Admin feedback fetch failed:", feedbackError);
      return NextResponse.json(
        { error: "Unable to load feedback." },
        { status: 500 }
      );
    }

    const rows = (feedbackRows ?? []) as FeedbackRow[];
    const userIds = Array.from(new Set(rows.map((row) => row.user_id)));
    const { data: profiles, error: profilesError } =
      userIds.length > 0
        ? await admin
            .from("profiles")
            .select("id, email, username, full_name")
            .in("id", userIds)
        : { data: [], error: null };

    if (profilesError) {
      console.error("Admin feedback profiles fetch failed:", profilesError);
      return NextResponse.json(
        { error: "Unable to load feedback profiles." },
        { status: 500 }
      );
    }

    const profileMap = new Map(
      ((profiles ?? []) as FeedbackProfile[]).map((profile) => [
        profile.id,
        profile,
      ])
    );

    const tickets = await Promise.all(
      rows.map(async (row) => {
        const profile = profileMap.get(row.user_id) ?? null;
        const screenshotUrl = await createFeedbackScreenshotSignedUrl(
          admin,
          row.screenshot_url
        );
        const ticket = feedbackTicketFromRow(row, profile, screenshotUrl);
        return {
          ...ticket,
          profile: {
            username: profile?.username ?? null,
            fullName: profile?.full_name ?? null,
          },
        };
      })
    );

    return NextResponse.json({ tickets });
  } catch (error) {
    console.error("Admin feedback fetch error:", error);
    return NextResponse.json(
      { error: "Unable to load feedback." },
      { status: 500 }
    );
  }
}
