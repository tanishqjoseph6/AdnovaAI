import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import { CREDITS_ERROR_CODE } from "@/lib/credits/constants";
import type { CreditFeatureId } from "@/lib/credits/schema";
import {
  deductUserCredits,
  getFeatureCost,
  getUserCreditsForUser,
} from "@/lib/credits/server";
import type { DeductCreditsResult } from "@/lib/credits/types";

export type FeatureCreditContext = {
  /** Resolved credit cost for this feature. */
  cost: number;
  /** Total spendable credits (monthly + purchased). */
  available: number;
  monthlyCredits: number;
  purchasedCredits: number;
};

export type FeatureCreditCheck =
  | ({ ok: true } & FeatureCreditContext)
  | { ok: false; response: NextResponse };

/**
 * Standardized 403 returned whenever a user cannot afford an AI action.
 */
export function insufficientCreditsResponse(
  required: number,
  available: number
): NextResponse {
  const plural = required === 1 ? "credit" : "credits";
  return NextResponse.json(
    {
      error: `Not enough credits. This action needs ${required} ${plural}, but you have ${available}. Buy more credits or upgrade your plan to continue.`,
      code: CREDITS_ERROR_CODE,
      required,
      available,
    },
    { status: 403 }
  );
}

/**
 * Pre-flight credit check performed BEFORE running an AI generation.
 * Monthly credits are consumed first at deduction time; purchased credits are
 * used automatically once monthly credits are exhausted.
 */
export async function checkFeatureCredits(
  userId: string,
  supabase: SupabaseClient,
  featureId: CreditFeatureId,
  options?: { email?: string | null }
): Promise<FeatureCreditCheck> {
  const [cost, credits] = await Promise.all([
    getFeatureCost(featureId),
    getUserCreditsForUser(userId, supabase, { email: options?.email }),
  ]);

  if (cost > 0 && credits.credits < cost) {
    return {
      ok: false,
      response: insufficientCreditsResponse(cost, credits.credits),
    };
  }

  return {
    ok: true,
    cost,
    available: credits.credits,
    monthlyCredits: credits.monthlyCredits,
    purchasedCredits: credits.purchasedCredits,
  };
}

/**
 * Deducts credits for a feature AFTER a successful AI generation. The
 * deduction is atomic, can never go negative, and is logged to
 * credit_transactions by the RPC (monthly bucket first, then purchased).
 */
export async function deductForFeature(
  userId: string,
  featureId: CreditFeatureId
): Promise<DeductCreditsResult> {
  return deductUserCredits({ userId, featureId });
}
