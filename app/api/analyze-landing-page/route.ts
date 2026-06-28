import { NextResponse } from "next/server";
import OpenAI from "openai";
import { requireVerifiedUser } from "@/lib/auth/require-user";
import {
  fetchLandingPageContent,
  normalizeLandingPageUrl,
} from "@/lib/landing-analyzer/fetch-page";
import { buildLandingAnalysisPrompt } from "@/lib/landing-analyzer/prompt";
import { summarizeLandingPageContent } from "@/lib/landing-analyzer/summarize-content";
import { normalizeLandingPageAnalysis } from "@/lib/landing-analyzer/types";
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

    const body = (await req.json()) as { url?: string };
    const rawUrl = typeof body.url === "string" ? body.url : "";

    let normalizedUrl: string;
    try {
      normalizedUrl = normalizeLandingPageUrl(rawUrl);
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Please enter a valid website URL.",
        },
        { status: 400 }
      );
    }

    const pageContent = await fetchLandingPageContent(normalizedUrl);
    const preparedContent = pageContent.needsSummarization
      ? await summarizeLandingPageContent(openai, pageContent)
      : pageContent;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a strict landing page auditor. Score each dimension independently using the full 0-100 range. Never cluster all scores near 50.",
        },
        {
          role: "user",
          content: buildLandingAnalysisPrompt(preparedContent),
        },
      ],
    });

    const content = response.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content) as unknown;
    const analysis = normalizeLandingPageAnalysis(parsed, normalizedUrl);

    if (!analysis) {
      return NextResponse.json(
        { error: "Failed to parse landing page analysis." },
        { status: 500 }
      );
    }

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error("POST /api/analyze-landing-page error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Landing page analysis failed.";

    const status =
      error instanceof Error &&
      (message.includes("URL") ||
        message.includes("fetch") ||
        message.includes("Not enough readable content") ||
        message.includes("timed out") ||
        message.includes("does not appear to be an HTML"))
        ? 400
        : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
