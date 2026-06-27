import { NextResponse } from "next/server";
import OpenAI from "openai";
import { buildAdScorePrompt } from "@/lib/ad-score/prompt";
import { normalizeAdScoreAnalysis } from "@/lib/ad-score/types";
import { createClient } from "@/lib/supabase/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as {
      productDescription?: string;
      hooks?: string[];
      captions?: string[];
      ctas?: string[];
      ugcScript?: string;
    };

    const productDescription =
      typeof body.productDescription === "string"
        ? body.productDescription.trim()
        : "";
    const hooks = Array.isArray(body.hooks)
      ? body.hooks.filter((item): item is string => typeof item === "string")
      : [];
    const captions = Array.isArray(body.captions)
      ? body.captions.filter((item): item is string => typeof item === "string")
      : [];
    const ctas = Array.isArray(body.ctas)
      ? body.ctas.filter((item): item is string => typeof item === "string")
      : [];
    const ugcScript =
      typeof body.ugcScript === "string" ? body.ugcScript.trim() : "";

    if (
      !productDescription ||
      (hooks.length === 0 &&
        captions.length === 0 &&
        ctas.length === 0 &&
        !ugcScript)
    ) {
      return NextResponse.json(
        { error: "Generated ad content is required for scoring." },
        { status: 400 }
      );
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You audit ad copy for conversion potential. Score each dimension independently using the full 0-100 range.",
        },
        {
          role: "user",
          content: buildAdScorePrompt({
            productDescription,
            hooks,
            captions,
            ctas,
            ugcScript,
          }),
        },
      ],
    });

    const content = response.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content) as unknown;
    const analysis = normalizeAdScoreAnalysis(parsed);

    if (!analysis) {
      return NextResponse.json(
        { error: "Failed to parse ad score analysis." },
        { status: 500 }
      );
    }

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error("POST /api/score-generated-ads error:", error);
    return NextResponse.json(
      { error: "Ad scoring failed. Please try again." },
      { status: 500 }
    );
  }
}
