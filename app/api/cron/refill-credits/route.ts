import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { creditsLog, creditsWarn } from "@/lib/credits/logger";
import { maybeRefillUserCredits } from "@/lib/credits/server";

export async function POST(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "Missing SUPABASE_SERVICE_ROLE_KEY" },
      { status: 500 }
    );
  }

  try {
    const admin = createAdminClient();
    const nowIso = new Date().toISOString();

    const { data: dueRows, error } = await admin
      .from("user_credits")
      .select("user_id")
      .or(`next_refill_at.is.null,next_refill_at.lte.${nowIso}`)
      .limit(500);

    if (error) {
      throw error;
    }

    let refilled = 0;
    let checked = 0;
    let failed = 0;

    for (const row of dueRows ?? []) {
      if (typeof row.user_id !== "string") {
        continue;
      }

      checked += 1;
      try {
        const result = await maybeRefillUserCredits(row.user_id);
        if (result.refilled) {
          refilled += 1;
        }
      } catch (refillError) {
        failed += 1;
        creditsWarn("credit_refill_cron", "User refill failed", {
          userId: row.user_id,
          error:
            refillError instanceof Error
              ? refillError.message
              : "unknown_error",
        });
      }
    }

    creditsLog("credit_refill_cron", "Daily credit refill cron completed", {
      checked,
      refilled,
      failed,
    });

    return NextResponse.json({
      success: true,
      checked,
      refilled,
      failed,
    });
  } catch (error) {
    console.error("Credit refill cron error:", error);
    return NextResponse.json(
      { error: "Unable to process credit refills." },
      { status: 500 }
    );
  }
}
