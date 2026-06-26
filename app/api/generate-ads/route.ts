import { NextResponse } from "next/server";
import {
  ensureUserProfile,
  incrementGenerationsUsedAtomically,
  isGenerationLimitReached,
} from "@/lib/subscription";
import { createClient } from "@/lib/supabase/server";
import OpenAI from "openai";

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

    const { productDescription } = await req.json();

    if (!productDescription) {
      return NextResponse.json(
        {
          error: "Product description is required",
        },
        { status: 400 }
      );
    }

    const subscription = await ensureUserProfile(user.id, user.email, supabase);

    if (isGenerationLimitReached(subscription)) {
      return NextResponse.json(
        { error: "Generation limit reached. Upgrade your plan." },
        { status: 403 }
      );
    }

    const prompt = `
You are an expert direct response copywriter.

Generate:

- 5 ad hooks
- 3 ad captions
- 3 CTAs
- 1 UGC video script

Product:
${productDescription}

Return ONLY valid JSON in this format:

{
  "ad_hooks": [
    "hook 1",
    "hook 2",
    "hook 3",
    "hook 4",
    "hook 5"
  ],
  "ad_captions": [
    "caption 1",
    "caption 2",
    "caption 3"
  ],
  "ctas": [
    "cta 1",
    "cta 2",
    "cta 3"
  ],
  "ugc_script": "full script here"
}
`;

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

    const incremented = await incrementGenerationsUsedAtomically(user.id);
    if (!incremented) {
      return NextResponse.json(
        { error: "Generation limit reached. Upgrade your plan." },
        { status: 403 }
      );
    }

    const { error: insertError } = await supabase.from("generations").insert({
      user_email: user.email ?? user.id,
      product_description: productDescription,
      hooks,
      captions,
      ctas,
      ugc_script: ugcScript,
    });

    if (insertError) {
      console.error("Supabase insert error:", insertError);
    }

    return NextResponse.json({
      hooks,
      captions,
      ctas,
      ugcScript,
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
