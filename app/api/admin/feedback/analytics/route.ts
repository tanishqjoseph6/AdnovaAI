import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/admin/auth";
import {
  computeFeedbackAnalytics,
  type FeedbackRow,
} from "@/lib/feedback/server";

export async function GET() {
  try {
    const authResult = await requireAdminUser();
    if ("response" in authResult) {
      return authResult.response;
    }

    const { admin } = authResult;
    const { data, error } = await admin.from("user_feedback").select("*");

    if (error) {
      console.error("Feedback analytics fetch failed:", error);
      return NextResponse.json(
        { error: "Unable to load feedback analytics." },
        { status: 500 }
      );
    }

    const analytics = computeFeedbackAnalytics((data ?? []) as FeedbackRow[]);
    return NextResponse.json({ analytics });
  } catch (error) {
    console.error("Feedback analytics error:", error);
    return NextResponse.json(
      { error: "Unable to load feedback analytics." },
      { status: 500 }
    );
  }
}
