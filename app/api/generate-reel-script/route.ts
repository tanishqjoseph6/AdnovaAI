import { NextResponse } from "next/server";
import { requireVerifiedUser } from "@/lib/auth/require-user";
import { clampAiPreferencesForPlan } from "@/lib/billing/ai-preferences-plan";
import { requireFeatureAccess } from "@/lib/billing/plan-access";
import { getUserPlanContext } from "@/lib/billing/plan-access";
import {
  checkFeatureCredits,
  deductForFeature,
  insufficientCreditsResponse,
} from "@/lib/credits/guard";
import { refundUserCredits } from "@/lib/credits/server";
import { CREDIT_FEATURES } from "@/lib/credits/schema";
import { buildReelScriptPrompt } from "@/lib/reel-script/prompt";
import { normalizeReelScriptResult } from "@/lib/reel-script/normalize";
import { saveReelScript } from "@/lib/reel-script/server";
import type { ReelScriptInput } from "@/lib/reel-script/types";
import { reelScriptRequestSchema } from "@/lib/reel-script/validation";
import {
  buildAiPreferencesPromptSection,
  resolveOpenAiGenerationConfig,
} from "@/lib/settings/ai-preferences";
import { getAiPreferencesForUser } from "@/lib/settings/ai-preferences-server";
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

    const featureResult = await requireFeatureAccess(
      supabase,
      user.id,
      "reel_script_generator"
    );
    if ("response" in featureResult) {
      return featureResult.response;
    }

    const body = await req.json().catch(() => ({}));
    const parsedBody = reelScriptRequestSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error:
            parsedBody.error.issues[0]?.message ??
            "Invalid reel script request.",
        },
        { status: 400 }
      );
    }

    const input: ReelScriptInput = {
      productUrl: parsedBody.data.productUrl ?? "",
      productDescription: parsedBody.data.productDescription,
      brandName: parsedBody.data.brandName,
      brandVoice: parsedBody.data.brandVoice,
      targetAudience: parsedBody.data.targetAudience,
      platform: parsedBody.data.platform,
      duration: parsedBody.data.duration as 15 | 30 | 60,
      goal: parsedBody.data.goal,
    };

    const creditCheck = await checkFeatureCredits(
      user.id,
      supabase,
      CREDIT_FEATURES.GENERATE_REEL_SCRIPT,
      { email: user.email }
    );
    if (!creditCheck.ok) {
      return creditCheck.response;
    }

    const planContext = await getUserPlanContext(supabase, user.id);
    const rawAiPreferences = await getAiPreferencesForUser(supabase, user.id);
    const aiPreferences = clampAiPreferencesForPlan(
      rawAiPreferences,
      planContext.plan,
      planContext.subscriptionStatus
    );
    const aiPreferencesSection =
      buildAiPreferencesPromptSection(aiPreferences);
    const generationConfig = resolveOpenAiGenerationConfig(aiPreferences);

    const prompt = `${buildReelScriptPrompt(input)}${
      aiPreferencesSection ? `\n\n${aiPreferencesSection}` : ""
    }`;

    const deduction = await deductForFeature(
      user.id,
      CREDIT_FEATURES.GENERATE_REEL_SCRIPT
    );
    if (deduction.insufficient) {
      return insufficientCreditsResponse(deduction.cost, deduction.credits);
    }

    let content = "{}";
    try {
      const response = await openai.chat.completions.create({
        model: generationConfig.model,
        temperature: Math.min(generationConfig.temperature + 0.1, 1),
        max_tokens: Math.max(generationConfig.maxTokens ?? 2000, 2500),
        response_format: { type: "json_object" },
        messages: [{ role: "user", content: prompt }],
      });
      content = response.choices[0]?.message?.content || "{}";
    } catch (openAiError) {
      if (deduction.deducted && deduction.cost > 0) {
        await refundUserCredits(
          user.id,
          deduction.cost,
          CREDIT_FEATURES.GENERATE_REEL_SCRIPT
        ).catch((refundError) => {
          console.error(
            "Failed to refund credits after reel script OpenAI error:",
            refundError
          );
        });
      }
      throw openAiError;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      if (deduction.deducted && deduction.cost > 0) {
        await refundUserCredits(
          user.id,
          deduction.cost,
          CREDIT_FEATURES.GENERATE_REEL_SCRIPT
        ).catch((refundError) => {
          console.error(
            "Failed to refund credits after reel script parse error:",
            refundError
          );
        });
      }

      return NextResponse.json(
        { error: "Failed to parse AI response. Please try again." },
        { status: 502 }
      );
    }

    const result = normalizeReelScriptResult(parsed);
    if (!result) {
      if (deduction.deducted && deduction.cost > 0) {
        await refundUserCredits(
          user.id,
          deduction.cost,
          CREDIT_FEATURES.GENERATE_REEL_SCRIPT
        ).catch((refundError) => {
          console.error(
            "Failed to refund credits after invalid reel script:",
            refundError
          );
        });
      }

      return NextResponse.json(
        { error: "AI returned an incomplete reel script. Please try again." },
        { status: 502 }
      );
    }

    const saved = await saveReelScript(supabase, user.id, input, result);

    return NextResponse.json({
      result,
      scriptId: saved?.id ?? null,
      credits: deduction.credits,
      saved: Boolean(saved),
    });
  } catch (error) {
    console.error("Generate reel script error:", error);
    return NextResponse.json(
      { error: "Failed to generate reel script. Please try again." },
      { status: 500 }
    );
  }
}
