import { NextResponse } from "next/server";
import { requireVerifiedUser } from "@/lib/auth/require-user";
import { clampAiPreferencesForPlan } from "@/lib/billing/ai-preferences-plan";
import { canAccessFeature } from "@/lib/billing/features";
import { getUserPlanContext } from "@/lib/billing/plan-access";
import {
  buildBrandKitPromptSection,
  getBrandKitForUser,
} from "@/lib/brand-kit/server";
import {
  checkFeatureCredits,
  deductForFeature,
  insufficientCreditsResponse,
} from "@/lib/credits/guard";
import { CREDIT_FEATURES } from "@/lib/credits/schema";
import {
  buildAiPreferencesPromptSection,
  resolveOpenAiGenerationConfig,
} from "@/lib/settings/ai-preferences";
import { getAiPreferencesForUser } from "@/lib/settings/ai-preferences-server";
import { buildGenerateAdsPrompt } from "@/lib/product-analysis/prompt";
import {
  formatProductAnalysisForPrompt,
  normalizeProductAnalysis,
} from "@/lib/product-analysis/types";
import { completeReferralAfterFirstGeneration } from "@/lib/referrals/server";
import { createClient } from "@/lib/supabase/server";
import OpenAI from "openai";

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

    const { productDescription, productAnalysis: rawAnalysis } = await req.json();

    if (!productDescription) {
      return NextResponse.json(
        {
          error: "Product description is required",
        },
        { status: 400 }
      );
    }

    const creditCheck = await checkFeatureCredits(
      user.id,
      supabase,
      CREDIT_FEATURES.GENERATE_ADS,
      { email: user.email }
    );
    if (!creditCheck.ok) {
      return creditCheck.response;
    }

    const planContext = await getUserPlanContext(supabase, user.id);
    const canUseBrandKit = canAccessFeature(
      planContext.plan,
      planContext.subscriptionStatus,
      "brand_kit"
    );

    const productAnalysis = normalizeProductAnalysis(rawAnalysis);
    const analysisSection = productAnalysis
      ? formatProductAnalysisForPrompt(productAnalysis)
      : undefined;

    const brandKit = canUseBrandKit
      ? await getBrandKitForUser(supabase, user.id)
      : null;
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
    const prompt = buildGenerateAdsPrompt(
      productDescription,
      analysisSection,
      brandKitSection,
      aiPreferencesSection
    );

    const response = await openai.chat.completions.create({
      model: generationConfig.model,
      temperature: generationConfig.temperature,
      max_tokens: generationConfig.maxTokens,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = response.choices[0].message.content || "{}";

    const parsed = JSON.parse(content) as Record<string, unknown>;

    const hooks = (parsed.hooks ?? parsed.ad_hooks ?? []) as string[];
    const captions = (parsed.captions ?? parsed.ad_captions ?? []) as string[];
    const ctas = (parsed.ctas ?? []) as string[];
    const ugcScript = (parsed.ugcScript ?? parsed.ugc_script ?? "") as string;

    let remainingCredits: number | null = null;

    if (!creditCheck.unlimited) {
      const deduction = await deductForFeature(
        user.id,
        CREDIT_FEATURES.GENERATE_ADS
      );
      if (deduction.insufficient) {
        return insufficientCreditsResponse(deduction.cost, deduction.credits);
      }
      remainingCredits = deduction.credits;
    }

    const { data: generationRow, error: insertError } = await supabase
      .from("generations")
      .insert({
        user_email: user.email ?? user.id,
        product_description: productDescription,
        hooks,
        captions,
        ctas,
        ugc_script: ugcScript,
        original_hooks: hooks,
        original_captions: captions,
        original_ctas: ctas,
        original_ugc_script: ugcScript,
      })
      .select("id, created_at")
      .single();

    if (insertError) {
      console.error("Supabase insert error:", insertError);
    } else {
      try {
        await completeReferralAfterFirstGeneration({
          referredUserId: user.id,
        });
      } catch (referralError) {
        console.error("Referral reward processing failed:", referralError);
      }
    }

    return NextResponse.json({
      hooks,
      captions,
      ctas,
      ugcScript,
      credits: remainingCredits,
      unlimited: creditCheck.unlimited,
      generationId: generationRow?.id,
      generatedAt: generationRow?.created_at ?? new Date().toISOString(),
      originalHooks: hooks,
      originalCaptions: captions,
      originalCtas: ctas,
      originalUgcScript: ugcScript,
      savedContentItems: [],
    });
  } catch (error) {
    console.error("OpenAI Error:", error);

    return NextResponse.json(
      {
        error: "Generation failed",
      },
      { status: 500 }
    );
  }
}
