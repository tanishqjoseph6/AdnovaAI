import { NextResponse } from "next/server";
import OpenAI from "openai";
import { requireVerifiedUser } from "@/lib/auth/require-user";
import { buildBetterCompetitorAdPrompt } from "@/lib/competitor-ad/prompt";
import {
  normalizeBetterCompetitorAd,
  type CompetitorAdAnalysis,
} from "@/lib/competitor-ad/types";
import { CREDITS_ERROR_CODE } from "@/lib/credits/constants";
import {
  canUseCredits,
  deductUserCredit,
  getUserCreditsForUser,
} from "@/lib/credits/server";
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

    const userCredits = await getUserCreditsForUser(user.id, supabase, {
      email: user.email,
    });

    if (!canUseCredits(userCredits)) {
      return NextResponse.json(
        {
          error: "No credits remaining. Upgrade to Pro for unlimited generations.",
          code: CREDITS_ERROR_CODE,
        },
        { status: 403 }
      );
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.5,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: buildBetterCompetitorAdPrompt(
            analysis as unknown as Record<string, unknown>
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

    if (!userCredits.unlimited) {
      const deduction = await deductUserCredit(user.id);
      if (deduction.insufficient) {
        return NextResponse.json(
          {
            error:
              "No credits remaining. Upgrade to Pro for unlimited generations.",
            code: CREDITS_ERROR_CODE,
          },
          { status: 403 }
        );
      }
      remainingCredits = deduction.credits;
    }

    const productDescription = `[Competitor Ad] ${analysis.brand || "Unknown brand"} — ${analysis.product || "Unknown product"} (${analysis.platform || "Unknown platform"})`;

    const { error: generationError } = await supabase.from("generations").insert({
      user_email: user.email ?? user.id,
      product_description: productDescription,
      hooks: betterAd.hooks,
      captions: betterAd.captions,
      ctas: betterAd.ctas,
      ugc_script: betterAd.ugcScript,
    });

    if (generationError) {
      console.error("generations insert error:", generationError);
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
      unlimited: userCredits.unlimited,
    });
  } catch (error) {
    console.error("POST /api/generate-better-competitor-ad error:", error);
    return NextResponse.json(
      { error: "Failed to generate better ad." },
      { status: 500 }
    );
  }
}
