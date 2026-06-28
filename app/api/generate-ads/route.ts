import { NextResponse } from "next/server";
import { requireVerifiedUser } from "@/lib/auth/require-user";
import {
  buildBrandKitPromptSection,
  getBrandKitForUser,
} from "@/lib/brand-kit/server";
import { CREDITS_ERROR_CODE } from "@/lib/credits/constants";
import {
  canUseCredits,
  deductUserCredit,
  getUserCreditsForUser,
} from "@/lib/credits/server";
import { buildGenerateAdsPrompt } from "@/lib/product-analysis/prompt";
import {
  formatProductAnalysisForPrompt,
  normalizeProductAnalysis,
} from "@/lib/product-analysis/types";
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

    const productAnalysis = normalizeProductAnalysis(rawAnalysis);
    const analysisSection = productAnalysis
      ? formatProductAnalysisForPrompt(productAnalysis)
      : undefined;

    const brandKit = await getBrandKitForUser(supabase, user.id);
    const brandKitSection = buildBrandKitPromptSection(brandKit);
    const prompt = buildGenerateAdsPrompt(
      productDescription,
      analysisSection,
      brandKitSection
    );

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
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

    const { data: generationRow, error: insertError } = await supabase
      .from("generations")
      .insert({
        user_email: user.email ?? user.id,
        product_description: productDescription,
        hooks,
        captions,
        ctas,
        ugc_script: ugcScript,
      })
      .select("id, created_at")
      .single();

    if (insertError) {
      console.error("Supabase insert error:", insertError);
    }

    return NextResponse.json({
      hooks,
      captions,
      ctas,
      ugcScript,
      credits: remainingCredits,
      unlimited: userCredits.unlimited,
      generationId: generationRow?.id,
      generatedAt: generationRow?.created_at ?? new Date().toISOString(),
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
