import { NextResponse } from "next/server";
import OpenAI from "openai";
import { requireVerifiedUser } from "@/lib/auth/require-user";
import { PRODUCT_IMAGE_ANALYSIS_PROMPT } from "@/lib/product-analysis/prompt";
import { normalizeProductAnalysis } from "@/lib/product-analysis/types";
import { createClient } from "@/lib/supabase/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ACCEPTED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const authResult = await requireVerifiedUser(supabase);
    if ("response" in authResult) {
      return authResult.response;
    }
    const user = authResult.user;

    const body = (await req.json()) as {
      image?: string;
      mimeType?: string;
    };

    const image = typeof body.image === "string" ? body.image.trim() : "";
    const mimeType =
      typeof body.mimeType === "string" ? body.mimeType.trim() : "";

    if (!image || !mimeType) {
      return NextResponse.json(
        { error: "Image data and mimeType are required" },
        { status: 400 }
      );
    }

    if (!ACCEPTED_MIME_TYPES.has(mimeType)) {
      return NextResponse.json(
        { error: "Unsupported image type" },
        { status: 400 }
      );
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Identify products conservatively. Never invent an exact model unless the image clearly shows it. Prefer brand + product family when uncertain.",
        },
        {
          role: "user",
          content: [
            { type: "text", text: PRODUCT_IMAGE_ANALYSIS_PROMPT },
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
    const analysis = normalizeProductAnalysis(parsed);

    if (!analysis) {
      return NextResponse.json(
        { error: "Failed to parse product analysis" },
        { status: 500 }
      );
    }

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error("POST /api/analyze-product-image error:", error);
    return NextResponse.json(
      { error: "Product image analysis failed" },
      { status: 500 }
    );
  }
}
