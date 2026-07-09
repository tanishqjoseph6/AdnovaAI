import { NextResponse } from "next/server";
import { requireVerifiedUser } from "@/lib/auth/require-user";
import { CREDITS_ERROR_CODE } from "@/lib/credits/constants";
import {
  canUseCredits,
  deductUserCredits,
  getUserCreditsForUser,
} from "@/lib/credits/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/credits/use
 * Deducts exactly one credit after a successful generation (server-validated).
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const authResult = await requireVerifiedUser(supabase);
    if ("response" in authResult) {
      return authResult.response;
    }
    const user = authResult.user;

    const current = await getUserCreditsForUser(user.id, supabase, {
      email: user.email,
    });

    if (!canUseCredits(current)) {
      return NextResponse.json(
        {
          error: "No credits remaining. Upgrade to Starter or Pro for more generations.",
          code: CREDITS_ERROR_CODE,
        },
        { status: 403 }
      );
    }

    if (current.unlimited) {
      return NextResponse.json({
        deducted: false,
        unlimited: true,
        credits: current.credits,
        plan: current.plan,
      });
    }

    const result = await deductUserCredits({
      userId: user.id,
      featureId: null,
      amountOverride: 1,
    });

    if (result.insufficient) {
      return NextResponse.json(
        {
          error: "No credits remaining. Upgrade to Starter or Pro for more generations.",
          code: CREDITS_ERROR_CODE,
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      deducted: result.deducted,
      unlimited: result.unlimited,
      credits: result.credits,
      plan: result.plan,
    });
  } catch (error) {
    console.error("POST /api/credits/use error:", error);
    return NextResponse.json(
      { error: "Failed to use credit" },
      { status: 500 }
    );
  }
}
