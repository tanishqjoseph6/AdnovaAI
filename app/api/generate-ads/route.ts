import { supabase } from "@/lib/supabase"
import OpenAI from "openai";
import { NextResponse } from "next/server";
import { error } from "console";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { productDescription } = await req.json();

    if (!productDescription) {
      return NextResponse.json(
        {
          error: "Product description is required",
        },
        { status: 400 }
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

    const content =
      response.choices[0].message.content || "{}";

    const parsed = JSON.parse(content);
    const { data, error } = await supabase
  .from("generations")
  .insert({
      user_email: "tanishq",
      product_description: productDescription,
      hooks: parsed.ad_hooks,
      captions: parsed.ad_captions,
      ctas: parsed.ctas,
      ugc_script: parsed.ugc_script,
    });

    console.log("SUPABASE DATA:",data);
    console.log("SUPABASE ERROR:",error)

    return NextResponse.json({
      hooks: parsed.ad_hooks || [],
      captions: parsed.ad_captions || [],
      ctas: parsed.ctas || [],
      ugcScript: parsed.ugc_script || "",
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