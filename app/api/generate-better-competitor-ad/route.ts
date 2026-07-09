import { NextResponse } from "next/server";
import OpenAI from "openai";
import { requireVerifiedUser } from "@/lib/auth/require-user";
import { clampAiPreferencesForPlan } from "@/lib/billing/ai-preferences-plan";
import { getUserPlanContext, requireFeatureAccess } from "@/lib/billing/plan-access";
import {
  buildBrandKitPromptSection,
  getBrandKitForUser,
} from "@/lib/brand-kit/server";
import { buildBetterCompetitorAdPrompt } from "@/lib/competitor-ad/prompt";
import {
  normalizeBetterCompetitorAd,
  type CompetitorAdAnalysis,
} from "@/lib/competitor-ad/types";
import {
  checkFeatureCredits,
  deductForFeature,
  insufficientCreditsResponse,
} from "@/lib/credits/guard";
import { CREDIT_FEATURES } from "@/lib/credits/schema";
import { completeReferralAfterFirstGeneration } from "@/lib/referrals/server";
import {
  buildAiPreferencesPromptSection,
  resolveOpenAiGenerationConfig,
} from "@/lib/settings/ai-preferences";
import { getAiPreferencesForUser } from "@/lib/settings/ai-preferences-server";
import { createClient } from "@/lib/supabase/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const authResult = await requireVerifiedUser(supabase);
    if ("response" in authResult) {
      return authResult.response;
    }
    const user = authResult.user;

    const featureResult = await requireFeatureAccess(
      supabase,
      user.id,
      "competitor_analyzer"
    );
    if ("response" in featureResult) {
      return featureResult.response;
    }

    const body = (await req.json()) as {
      analysis?: CompetitorAdAnalysis;
      analysisId?: string;
    };

    const analysis = body.analysis;
    const analysisId =
      typeof body.analysisId === "string" ? body.analysisId : analysis?.id;

    if (!analysis) {
      return NextResponse.json(
        { error: "Competitor analysis is required." },
        { status: 400 }
      );
    }

    const creditCheck = await checkFeatureCredits(
      user.id,
      supabase,
      CREDIT_FEATURES.GENERATE_BETTER_COMPETITOR_AD,
      { email: user.email }
    );
    if (!creditCheck.ok) {
      return creditCheck.response;
    }

    const planContext = await getUserPlanContext(supabase, user.id);
    const brandKit = await getBrandKitForUser(supabase, user.id);
    const brandKitSection = buildBrandKitPromptSection(brandKit);
    const rawAiPreferences = await getAiPreferencesForUser(supabase, user.id);
    const aiPreferences = clampAiPreferencesForPlan(
      rawAiPreferences,
      planContext.plan,
      planContext.subscriptionStatus
    );
    const aiPreferencesSection =
      buildAiPreferencesPromptSection(aiPreferences);
    const generationConfig = resolveOpenAiGenerationConfig(aiPreferences);

    const response = await openai.chat.completions.create({
      model: generationConfig.model,
      temperature: generationConfig.temperature,
      max_tokens: generationConfig.maxTokens,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: buildBetterCompetitorAdPrompt(
            analysis as unknown as Record<string, unknown>,
            brandKitSection,
            aiPreferencesSection
          ),
        },
      ],
    });

    const content = response.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content) as unknown;
    const betterAd = normalizeBetterCompetitorAd(parsed);

    if (!betterAd) {
      return NextResponse.json(
        { error: "Failed to parse generated ad content." },
        { status: 500 }
      );
    }

    let remainingCredits: number | null = null;
    const deduction = await deductForFeature(
      user.id,
      CREDIT_FEATURES.GENERATE_BETTER_COMPETITOR_AD
    );
    if (deduction.insufficient) {
      return insufficientCreditsResponse(deduction.cost, deduction.credits);
    }
    remainingCredits = deduction.credits;

    const productDescription = `[Competitor Ad] ${analysis.brand || "Unknown brand"} — ${analysis.product || "Unknown product"} (${analysis.platform || "Unknown platform"})`;

    const { data: generationRow, error: generationError } = await supabase
      .from("generations")
      .insert({
        user_email: user.email ?? user.id,
        product_description: productDescription,
        hooks: betterAd.hooks,
        captions: betterAd.captions,
        ctas: betterAd.ctas,
        ugc_script: betterAd.ugcScript,
      })
      .select("id, created_at")
      .single();

    if (generationError) {
      console.error("generations insert error:", generationError);
    } else {
      try {
        await completeReferralAfterFirstGeneration({
          referredUserId: user.id,
        });
      } catch (referralError) {
        console.error("Referral reward processing failed:", referralError);
      }
    }

    if (analysisId) {
      const { error: updateError } = await supabase
        .from("competitor_analyses")
        .update({ better_ad: betterAd })
        .eq("id", analysisId);

      if (updateError) {
        console.error("competitor_analyses update error:", updateError);
      }
    }

    return NextResponse.json({
      hooks: betterAd.hooks,
      headlines: betterAd.headlines,
      captions: betterAd.captions,
      ctas: betterAd.ctas,
      offers: betterAd.offers,
      ugcScript: betterAd.ugcScript,
      target_audience: betterAd.target_audience,
      emotional_angle: betterAd.emotional_angle,
      visual_suggestions: betterAd.visual_suggestions,
      credits: remainingCredits,
      generationId: generationRow?.id,
      generatedAt: generationRow?.created_at ?? new Date().toISOString(),
    });
  } catch (error) {
    console.error("POST /api/generate-better-competitor-ad error:", error);
    return NextResponse.json(
      { error: "Failed to generate better ad." },
      { status: 500 }
    );
  }
}
