import { NextResponse } from "next/server";
import { requireVerifiedUser } from "@/lib/auth/require-user";
import { requireFeatureAccess } from "@/lib/billing/plan-access";
import {
  checkFeatureCredits,
  deductForFeature,
  insufficientCreditsResponse,
} from "@/lib/credits/guard";
import { refundUserCredits } from "@/lib/credits/server";
import { CREDIT_FEATURES } from "@/lib/credits/schema";
import { generateThumbnailResult } from "@/lib/thumbnail/image-gen";
import { saveThumbnail } from "@/lib/thumbnail/server";
import type { ThumbnailInput } from "@/lib/thumbnail/types";
import { thumbnailRequestSchema } from "@/lib/thumbnail/validation";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 120;

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
      "thumbnail_generator"
    );
    if ("response" in featureResult) {
      return featureResult.response;
    }

    const body = await req.json().catch(() => ({}));
    const parsedBody = thumbnailRequestSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error:
            parsedBody.error.issues[0]?.message ??
            "Invalid thumbnail request.",
        },
        { status: 400 }
      );
    }

    const input: ThumbnailInput = {
      format: parsedBody.data.format,
      prompt: parsedBody.data.prompt,
      productUrl: parsedBody.data.productUrl ?? "",
      productImageBase64: parsedBody.data.productImageBase64 ?? null,
      productImageMimeType: parsedBody.data.productImageMimeType ?? null,
      logoBase64: parsedBody.data.logoBase64 ?? null,
      logoMimeType: parsedBody.data.logoMimeType ?? null,
      brandName: parsedBody.data.brandName,
      brandColors: parsedBody.data.brandColors,
      variationCount: parsedBody.data.variationCount as 2 | 3 | 4,
      templateId: parsedBody.data.templateId ?? null,
    };

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Image generation is not configured." },
        { status: 503 }
      );
    }

    const creditCheck = await checkFeatureCredits(
      user.id,
      supabase,
      CREDIT_FEATURES.GENERATE_THUMBNAIL,
      { email: user.email }
    );
    if (!creditCheck.ok) {
      return creditCheck.response;
    }

    const deduction = await deductForFeature(
      user.id,
      CREDIT_FEATURES.GENERATE_THUMBNAIL
    );
    if (deduction.insufficient) {
      return insufficientCreditsResponse(deduction.cost, deduction.credits);
    }

    let result;
    try {
      result = await generateThumbnailResult(user.id, input);
    } catch (generationError) {
      if (deduction.deducted && deduction.cost > 0) {
        await refundUserCredits(
          user.id,
          deduction.cost,
          CREDIT_FEATURES.GENERATE_THUMBNAIL
        ).catch((refundError) => {
          console.error(
            "Failed to refund credits after thumbnail generation error:",
            refundError
          );
        });
      }
      throw generationError;
    }

    if (!result) {
      if (deduction.deducted && deduction.cost > 0) {
        await refundUserCredits(
          user.id,
          deduction.cost,
          CREDIT_FEATURES.GENERATE_THUMBNAIL
        ).catch((refundError) => {
          console.error(
            "Failed to refund credits after empty thumbnail result:",
            refundError
          );
        });
      }

      return NextResponse.json(
        {
          error:
            "AI could not generate thumbnail variations. Please try again.",
        },
        { status: 502 }
      );
    }

    const saved = await saveThumbnail(supabase, user.id, input, result);

    return NextResponse.json({
      result,
      thumbnailId: saved?.id ?? null,
      credits: deduction.credits,
      saved: Boolean(saved),
    });
  } catch (error) {
    console.error("Generate thumbnail error:", error);
    return NextResponse.json(
      { error: "Failed to generate thumbnails. Please try again." },
      { status: 500 }
    );
  }
}
