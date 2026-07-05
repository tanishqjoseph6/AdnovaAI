import type { SupabaseClient } from "@supabase/supabase-js";
import {
  DEFAULT_AI_PREFERENCES,
  type AiPreferences,
  type AiPreferencesRecord,
} from "@/lib/settings/ai-preferences";

type AiPreferencesRow = {
  user_id: string;
  language: string;
  tone: string;
  caption_length: string;
  emoji_usage: string;
  cta_style: string;
  creative_level: number;
  generation_quality: string;
  platform: string;
  audience: string;
  brand_voice: string;
  created_at: string;
  updated_at: string;
};

function rowToRecord(row: AiPreferencesRow): AiPreferencesRecord {
  return {
    userId: row.user_id,
    language: row.language as AiPreferencesRecord["language"],
    tone: row.tone as AiPreferencesRecord["tone"],
    captionLength: row.caption_length as AiPreferencesRecord["captionLength"],
    emojiUsage: row.emoji_usage as AiPreferencesRecord["emojiUsage"],
    ctaStyle: row.cta_style as AiPreferencesRecord["ctaStyle"],
    creativeLevel: row.creative_level,
    generationQuality:
      row.generation_quality as AiPreferencesRecord["generationQuality"],
    platform: row.platform as AiPreferencesRecord["platform"],
    audience: row.audience as AiPreferencesRecord["audience"],
    brandVoice: row.brand_voice as AiPreferencesRecord["brandVoice"],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function preferencesToRow(
  userId: string,
  preferences: AiPreferences,
  updatedAt: string
): Omit<AiPreferencesRow, "created_at"> {
  return {
    user_id: userId,
    language: preferences.language,
    tone: preferences.tone,
    caption_length: preferences.captionLength,
    emoji_usage: preferences.emojiUsage,
    cta_style: preferences.ctaStyle,
    creative_level: preferences.creativeLevel,
    generation_quality: preferences.generationQuality,
    platform: preferences.platform,
    audience: preferences.audience,
    brand_voice: preferences.brandVoice,
    updated_at: updatedAt,
  };
}

export async function getAiPreferencesForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<AiPreferencesRecord> {
  const { data, error } = await supabase
    .from("user_ai_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("AI preferences fetch failed:", error.message);
    const now = new Date().toISOString();
    return {
      userId,
      ...DEFAULT_AI_PREFERENCES,
      createdAt: now,
      updatedAt: now,
    };
  }

  if (!data) {
    const now = new Date().toISOString();
    return {
      userId,
      ...DEFAULT_AI_PREFERENCES,
      createdAt: now,
      updatedAt: now,
    };
  }

  return rowToRecord(data as AiPreferencesRow);
}

export async function saveAiPreferencesForUser(
  supabase: SupabaseClient,
  userId: string,
  preferences: AiPreferences
): Promise<AiPreferencesRecord | null> {
  const now = new Date().toISOString();
  const row = preferencesToRow(userId, preferences, now);

  const { data, error } = await supabase
    .from("user_ai_preferences")
    .upsert(
      {
        ...row,
        created_at: now,
      },
      { onConflict: "user_id" }
    )
    .select("*")
    .single();

  if (error) {
    console.error("AI preferences save failed:", error.message);
    return null;
  }

  return rowToRecord(data as AiPreferencesRow);
}
