import { NextResponse } from "next/server";
import { publishDueScheduledPosts } from "@/lib/social-scheduler/publish";

export async function POST(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await publishDueScheduledPosts();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Publish due scheduled posts error:", error);
    return NextResponse.json(
      { error: "Unable to process scheduled posts." },
      { status: 500 }
    );
  }
}
