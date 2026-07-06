import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import {
  clampAiPreferencesForPlan,
  validateAiPreferencesForPlan,
} from "@/lib/billing/ai-preferences-plan";
import { getUserPlanContext } from "@/lib/billing/plan-access";
import { FEATURE_LOCKED_CODE } from "@/lib/billing/features";
import {
  aiPreferencesToApiResponse,
  validateAiPreferences,
} from "@/lib/settings/ai-preferences";
import {
  getAiPreferencesForUser,
  saveAiPreferencesForUser,
} from "@/lib/settings/ai-preferences-server";
import { createClient } from "@/lib/supabase/server";

type AiPreferencesPayload = {
  language?: unknown;
  tone?: unknown;
  captionLength?: unknown;
  emojiUsage?: unknown;
  ctaStyle?: unknown;
  creativeLevel?: unknown;
  generationQuality?: unknown;
  platform?: unknown;
  audience?: unknown;
  brandVoice?: unknown;
};

export async function GET() {
  try {
    const supabase = await createClient();
    const authResult = await requireAuthenticatedUser(supabase);
    if ("response" in authResult) {
      return authResult.response;
    }

    const preferences = await getAiPreferencesForUser(
      supabase,
      authResult.user.id
    );

    return NextResponse.json({
      preferences: aiPreferencesToApiResponse(preferences),
    });
  } catch (error) {
    console.error("AI preferences fetch error:", error);
    return NextResponse.json(
      { error: "Unable to load AI preferences." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const authResult = await requireAuthenticatedUser(supabase);
    if ("response" in authResult) {
      return authResult.response;
    }

    const body = (await request.json().catch(() => ({}))) as AiPreferencesPayload;
    const existing = await getAiPreferencesForUser(
      supabase,
      authResult.user.id
    );

    const validation = validateAiPreferences({
      language:
        typeof body.language === "string" ? body.language : existing.language,
      tone: typeof body.tone === "string" ? body.tone : existing.tone,
      captionLength:
        typeof body.captionLength === "string"
          ? body.captionLength
          : existing.captionLength,
      emojiUsage:
        typeof body.emojiUsage === "string"
          ? body.emojiUsage
          : existing.emojiUsage,
      ctaStyle:
        typeof body.ctaStyle === "string" ? body.ctaStyle : existing.ctaStyle,
      creativeLevel:
        typeof body.creativeLevel === "number"
          ? body.creativeLevel
          : existing.creativeLevel,
      generationQuality:
        typeof body.generationQuality === "string"
          ? body.generationQuality
          : existing.generationQuality,
      platform:
        typeof body.platform === "string" ? body.platform : existing.platform,
      audience:
        typeof body.audience === "string" ? body.audience : existing.audience,
      brandVoice:
        typeof body.brandVoice === "string"
          ? body.brandVoice
          : existing.brandVoice,
    });

    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const planContext = await getUserPlanContext(supabase, authResult.user.id);
    const planValidation = validateAiPreferencesForPlan(
      validation.value,
      planContext.plan,
      planContext.subscriptionStatus
    );
    if (!planValidation.ok) {
      return NextResponse.json(
        {
          error: planValidation.error,
          code: FEATURE_LOCKED_CODE,
          feature: planValidation.feature,
        },
        { status: 403 }
      );
    }

    const clamped = clampAiPreferencesForPlan(
      validation.value,
      planContext.plan,
      planContext.subscriptionStatus
    );

    const saved = await saveAiPreferencesForUser(
      supabase,
      authResult.user.id,
      clamped
    );

    if (!saved) {
      return NextResponse.json(
        { error: "Unable to save AI preferences. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      preferences: aiPreferencesToApiResponse(saved),
    });
  } catch (error) {
    console.error("AI preferences save error:", error);
    return NextResponse.json(
      { error: "Unable to save AI preferences. Please try again." },
      { status: 500 }
    );
  }
}
