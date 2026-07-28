import { BRAND_VOICES, type BrandVoice } from "@/lib/brand-kit/types";

export const REEL_PLATFORMS = [
  "instagram",
  "tiktok",
  "youtube_shorts",
] as const;

export const REEL_DURATIONS = [15, 30, 60] as const;

export const REEL_GOALS = [
  "sales",
  "awareness",
  "launch",
  "educational",
  "ugc",
] as const;

export type ReelPlatform = (typeof REEL_PLATFORMS)[number];
export type ReelDuration = (typeof REEL_DURATIONS)[number];
export type ReelGoal = (typeof REEL_GOALS)[number];

export const REEL_PLATFORM_LABELS: Record<ReelPlatform, string> = {
  instagram: "Instagram Reels",
  tiktok: "TikTok",
  youtube_shorts: "YouTube Shorts",
};

export const REEL_GOAL_LABELS: Record<ReelGoal, string> = {
  sales: "Sales",
  awareness: "Awareness",
  launch: "Launch",
  educational: "Educational",
  ugc: "UGC",
};

export const REEL_BRAND_VOICES = BRAND_VOICES;
export type ReelBrandVoice = BrandVoice;

export type ReelScriptScene = {
  sceneNumber: number;
  timestamp: string;
  visual: string;
  cameraDirection: string;
  onScreenText: string;
  voiceOver: string;
  bRoll: string;
};

export type ReelScriptResult = {
  hooks: string[];
  scrollStoppingOpening: string;
  scenes: ReelScriptScene[];
  voiceOverScript: string;
  cta: string;
  caption: string;
  hashtags: string[];
  thumbnailTitle: string;
};

export type ReelScriptInput = {
  productUrl: string;
  productDescription: string;
  brandName: string;
  brandVoice: ReelBrandVoice;
  targetAudience: string;
  platform: ReelPlatform;
  duration: ReelDuration;
  goal: ReelGoal;
};

export type ReelScriptRecord = {
  id: string;
  user_id: string;
  product_url: string | null;
  product_description: string;
  brand_name: string;
  brand_voice: string;
  target_audience: string;
  platform: ReelPlatform;
  duration: ReelDuration;
  goal: ReelGoal;
  result: ReelScriptResult;
  created_at: string;
  updated_at: string;
};

export const EMPTY_REEL_SCRIPT_INPUT: ReelScriptInput = {
  productUrl: "",
  productDescription: "",
  brandName: "",
  brandVoice: "Professional",
  targetAudience: "",
  platform: "instagram",
  duration: 30,
  goal: "sales",
};

export function createEmptyReelScriptResult(): ReelScriptResult {
  return {
    hooks: [],
    scrollStoppingOpening: "",
    scenes: [],
    voiceOverScript: "",
    cta: "",
    caption: "",
    hashtags: [],
    thumbnailTitle: "",
  };
}
