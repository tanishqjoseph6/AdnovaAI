import type {
  ReelDuration,
  ReelGoal,
  ReelPlatform,
  ReelScriptInput,
  ReelScriptRecord,
  ReelScriptResult,
} from "@/lib/reel-script/types";
import { normalizeReelScriptResult } from "@/lib/reel-script/normalize";
import type { SupabaseClient } from "@supabase/supabase-js";

type ReelScriptRow = {
  id: string;
  user_id: string;
  product_url: string | null;
  product_description: string;
  brand_name: string;
  brand_voice: string;
  target_audience: string;
  platform: string;
  duration: number;
  goal: string;
  result: unknown;
  created_at: string;
  updated_at: string;
};

function isPlatform(value: string): value is ReelPlatform {
  return value === "instagram" || value === "tiktok" || value === "youtube_shorts";
}

function isGoal(value: string): value is ReelGoal {
  return (
    value === "sales" ||
    value === "awareness" ||
    value === "launch" ||
    value === "educational" ||
    value === "ugc"
  );
}

function isDuration(value: number): value is ReelDuration {
  return value === 15 || value === 30 || value === 60;
}

export function reelScriptFromRow(row: unknown): ReelScriptRecord | null {
  if (!row || typeof row !== "object") return null;
  const data = row as ReelScriptRow;

  if (
    typeof data.id !== "string" ||
    typeof data.user_id !== "string" ||
    typeof data.product_description !== "string" ||
    typeof data.brand_name !== "string" ||
    typeof data.platform !== "string" ||
    typeof data.duration !== "number" ||
    typeof data.goal !== "string" ||
    !isPlatform(data.platform) ||
    !isDuration(data.duration) ||
    !isGoal(data.goal)
  ) {
    return null;
  }

  const result = normalizeReelScriptResult(data.result);
  if (!result) return null;

  return {
    id: data.id,
    user_id: data.user_id,
    product_url: data.product_url,
    product_description: data.product_description,
    brand_name: data.brand_name,
    brand_voice: data.brand_voice,
    target_audience: data.target_audience,
    platform: data.platform,
    duration: data.duration,
    goal: data.goal,
    result,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

export async function saveReelScript(
  supabase: SupabaseClient,
  userId: string,
  input: ReelScriptInput,
  result: ReelScriptResult
): Promise<ReelScriptRecord | null> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("reel_scripts")
    .insert({
      user_id: userId,
      product_url: input.productUrl.trim() || null,
      product_description: input.productDescription,
      brand_name: input.brandName,
      brand_voice: input.brandVoice,
      target_audience: input.targetAudience,
      platform: input.platform,
      duration: input.duration,
      goal: input.goal,
      result,
      created_at: now,
      updated_at: now,
    })
    .select("*")
    .single();

  if (error) {
    console.error("Failed to save reel script:", error);
    return null;
  }

  return reelScriptFromRow(data);
}

export async function listReelScriptsForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<ReelScriptRecord[]> {
  const { data, error } = await supabase
    .from("reel_scripts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to list reel scripts:", error);
    return [];
  }

  return (data ?? [])
    .map(reelScriptFromRow)
    .filter((row): row is ReelScriptRecord => row !== null);
}
