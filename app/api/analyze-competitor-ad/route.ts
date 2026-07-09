import { NextResponse } from "next/server";
import OpenAI from "openai";
import { requireVerifiedUser } from "@/lib/auth/require-user";
import { requireFeatureAccess } from "@/lib/billing/plan-access";
import { COMPETITOR_AD_ANALYSIS_PROMPT } from "@/lib/competitor-ad/prompt";
import { normalizeCompetitorAdAnalysis } from "@/lib/competitor-ad/types";
import {
  checkFeatureCredits,
  deductForFeature,
  insufficientCreditsResponse,
} from "@/lib/credits/guard";
import { CREDIT_FEATURES } from "@/lib/credits/schema";
import { createClient } from "@/lib/supabase/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ACCEPTED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

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
      image?: string;
      mimeType?: string;
      imageName?: string;
    };

    const image = typeof body.image === "string" ? body.image.trim() : "";
    const mimeType =
      typeof body.mimeType === "string" ? body.mimeType.trim() : "";
    const imageName =
      typeof body.imageName === "string" ? body.imageName.trim() : null;

    if (!image || !mimeType) {
      return NextResponse.json(
        { error: "Image data and mimeType are required" },
        { status: 400 }
      );
    }

    if (!ACCEPTED_MIME_TYPES.has(mimeType)) {
      return NextResponse.json(
        { error: "Only JPG, PNG, and WebP images are supported." },
        { status: 400 }
      );
    }

    const creditCheck = await checkFeatureCredits(
      user.id,
      supabase,
      CREDIT_FEATURES.ANALYZE_COMPETITOR_AD,
      { email: user.email }
    );
    if (!creditCheck.ok) {
      return creditCheck.response;
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You analyze competitor ad screenshots for performance marketers. Be specific and base conclusions only on visible ad content.",
        },
        {
          role: "user",
          content: [
            { type: "text", text: COMPETITOR_AD_ANALYSIS_PROMPT },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${image}`,
              },
            },
          ],
        },
      ],
    });

    const content = response.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content) as unknown;
    const analysis = normalizeCompetitorAdAnalysis(parsed);

    if (!analysis) {
      return NextResponse.json(
        { error: "Failed to parse competitor ad analysis." },
        { status: 500 }
      );
    }

    let remainingCredits: number | null = null;
    const deduction = await deductForFeature(
      user.id,
      CREDIT_FEATURES.ANALYZE_COMPETITOR_AD
    );
    if (deduction.insufficient) {
      return insufficientCreditsResponse(deduction.cost, deduction.credits);
    }
    remainingCredits = deduction.credits;

    const { data: inserted, error: insertError } = await supabase
      .from("competitor_analyses")
      .insert({
        user_email: user.email ?? user.id,
        image_name: imageName,
        analysis,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("competitor_analyses insert error:", insertError);
    }

    return NextResponse.json({
      analysis: {
        ...analysis,
        id: inserted?.id,
      },
      credits: remainingCredits,
    });
  } catch (error) {
    console.error("POST /api/analyze-competitor-ad error:", error);
    return NextResponse.json(
      { error: "Competitor ad analysis failed." },
      { status: 500 }
    );
  }
}
