import { NextRequest, NextResponse } from "next/server";
import { generateAdsWithGemini } from "@/lib/gemini/generate-ads";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const result = await generateAdsWithGemini(
      body.productDescription
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Failed to generate ads",
      },
      { status: 500 }
    );
  }
}