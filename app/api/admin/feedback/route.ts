import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/admin/auth";
import {
  createFeedbackScreenshotSignedUrl,
  feedbackTicketFromRow,
  isFeedbackStatus,
  type FeedbackProfile,
  type FeedbackRow,
} from "@/lib/feedback/server";
import {
  isFeedbackCategory,
  isFeedbackReaction,
  isFeedbackRating,
} from "@/lib/feedback/validation";

function parseSort(value: string | null): "created_desc" | "created_asc" | "rating_desc" | "rating_asc" {
  if (
    value === "created_asc" ||
    value === "rating_desc" ||
    value === "rating_asc"
  ) {
    return value;
  }
  return "created_desc";
}

export async function GET(request: Request) {
  try {
    const authResult = await requireAdminUser();
    if ("response" in authResult) {
      return authResult.response;
    }

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");
    const categoryParam = searchParams.get("category");
    const ratingParam = searchParams.get("rating");
    const reactionParam = searchParams.get("reaction");
    const query = searchParams.get("q")?.trim().toLowerCase() ?? "";
    const sort = parseSort(searchParams.get("sort"));

    const { admin } = authResult;
    let dbQuery = admin.from("user_feedback").select("*");

    if (statusParam && statusParam !== "all" && isFeedbackStatus(statusParam)) {
      dbQuery = dbQuery.eq("status", statusParam);
    }

    if (categoryParam && categoryParam !== "all" && isFeedbackCategory(categoryParam)) {
      dbQuery = dbQuery.eq("category", categoryParam);
    }

    if (ratingParam && ratingParam !== "all") {
      const rating = Number(ratingParam);
      if (isFeedbackRating(rating)) {
        dbQuery = dbQuery.eq("rating", rating);
      }
    }

    if (reactionParam && reactionParam !== "all" && isFeedbackReaction(reactionParam)) {
      dbQuery = dbQuery.eq("reaction", reactionParam);
    }

    if (sort === "created_asc") {
      dbQuery = dbQuery.order("created_at", { ascending: true });
    } else if (sort === "rating_desc") {
      dbQuery = dbQuery.order("rating", { ascending: false }).order("created_at", { ascending: false });
    } else if (sort === "rating_asc") {
      dbQuery = dbQuery.order("rating", { ascending: true }).order("created_at", { ascending: false });
    } else {
      dbQuery = dbQuery.order("created_at", { ascending: false });
    }

    const { data: feedbackRows, error: feedbackError } = await dbQuery;

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

    const filteredTickets = query
      ? tickets.filter((ticket) => {
          const haystack = `${ticket.subject} ${ticket.message} ${ticket.email} ${ticket.userName}`.toLowerCase();
          return haystack.includes(query);
        })
      : tickets;

    return NextResponse.json({ tickets: filteredTickets });
  } catch (error) {
    console.error("Admin feedback fetch error:", error);
    return NextResponse.json(
      { error: "Unable to load feedback." },
      { status: 500 }
    );
  }
}
