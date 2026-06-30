import { NextResponse } from "next/server";
import OpenAI from "openai";
import { requireVerifiedUser } from "@/lib/auth/require-user";
import {
  buildBrandKitPromptSection,
  getBrandKitForUser,
} from "@/lib/brand-kit/server";
import { isContentKind, isRewriteAction, REWRITE_ACTION_LABELS } from "@/lib/content-editor/types";
import { createClient } from "@/lib/supabase/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function buildRewritePrompt(input: {
  content: string;
  kind: string;
  actionLabel: string;
  brandKitSection?: string;
}) {
  return `You are Advora AI's content editor.

Rewrite ONLY the selected ${input.kind}. Do not generate hooks, captions, CTAs, or scripts beyond this one selected item.

Rewrite action: ${input.actionLabel}

Selected content:
${input.content}
${input.brandKitSection ? `\n\n${input.brandKitSection}` : ""}

Return ONLY valid JSON:
{
  "text": "the rewritten selected content only"
}`;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const authResult = await requireVerifiedUser(supabase);
    if ("response" in authResult) {
      return authResult.response;
    }

    const body = (await request.json().catch(() => ({}))) as {
      generationId?: unknown;
      kind?: unknown;
      action?: unknown;
      content?: unknown;
    };

    if (!isContentKind(body.kind) || !isRewriteAction(body.action)) {
      return NextResponse.json(
        { error: "Invalid rewrite request." },
        { status: 400 }
      );
    }

    const content = typeof body.content === "string" ? body.content.trim() : "";
    if (!content) {
      return NextResponse.json(
        { error: "Selected content is required." },
        { status: 400 }
      );
    }

    if (typeof body.generationId === "string") {
      const { data: generation, error } = await supabase
        .from("generations")
        .select("id")
        .eq("id", body.generationId)
        .in("user_email", [authResult.user.email ?? "", authResult.user.id])
        .maybeSingle();

      if (error) {
        console.error("Rewrite ownership check failed:", error.message);
        return NextResponse.json(
          { error: "Unable to verify this generation." },
          { status: 500 }
        );
      }

      if (!generation) {
        return NextResponse.json(
          { error: "Generation not found." },
          { status: 404 }
        );
      }
    }

    const brandKit = await getBrandKitForUser(supabase, authResult.user.id);
    const brandKitSection = buildBrandKitPromptSection(brandKit);

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: buildRewritePrompt({
            content,
            kind: body.kind,
            actionLabel: REWRITE_ACTION_LABELS[body.action],
            brandKitSection,
          }),
        },
      ],
    });

    const parsed = JSON.parse(
      response.choices[0]?.message?.content ?? "{}"
    ) as Record<string, unknown>;
    const text = typeof parsed.text === "string" ? parsed.text.trim() : "";

    if (!text) {
      return NextResponse.json(
        { error: "AI rewrite returned empty content." },
        { status: 500 }
      );
    }

    return NextResponse.json({ text });
  } catch (error) {
    console.error("AI rewrite error:", error);
    return NextResponse.json(
      { error: "Unable to rewrite this content." },
      { status: 500 }
    );
  }
}
