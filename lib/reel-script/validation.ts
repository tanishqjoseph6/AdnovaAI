import { z } from "zod";
import { BRAND_VOICES } from "@/lib/brand-kit/types";
import {
  REEL_DURATIONS,
  REEL_GOALS,
  REEL_PLATFORMS,
} from "@/lib/reel-script/types";

export const reelScriptRequestSchema = z.object({
  productUrl: z
    .string()
    .trim()
    .max(2048, "Product URL must be at most 2048 characters")
    .optional()
    .or(z.literal("")),
  productDescription: z
    .string()
    .trim()
    .min(20, "Product description must be at least 20 characters")
    .max(4000, "Product description must be at most 4000 characters"),
  brandName: z
    .string()
    .trim()
    .min(1, "Brand name is required")
    .max(120, "Brand name must be at most 120 characters"),
  brandVoice: z.enum(BRAND_VOICES),
  targetAudience: z
    .string()
    .trim()
    .min(3, "Target audience is required")
    .max(500, "Target audience must be at most 500 characters"),
  platform: z.enum(REEL_PLATFORMS),
  duration: z.union([
    z.literal(15),
    z.literal(30),
    z.literal(60),
    z.coerce.number().refine((value): value is 15 | 30 | 60 => {
      return (REEL_DURATIONS as readonly number[]).includes(value);
    }, "Duration must be 15, 30, or 60 seconds"),
  ]),
  goal: z.enum(REEL_GOALS),
});

export const reelScriptSceneSchema = z.object({
  sceneNumber: z.number().int().positive(),
  timestamp: z.string().min(1),
  visual: z.string().min(1),
  cameraDirection: z.string().min(1),
  onScreenText: z.string(),
  voiceOver: z.string(),
  bRoll: z.string(),
});

export const reelScriptResultSchema = z.object({
  hooks: z.array(z.string().min(1)).min(5).max(5),
  scrollStoppingOpening: z.string().min(1),
  scenes: z.array(reelScriptSceneSchema).min(1),
  voiceOverScript: z.string().min(1),
  cta: z.string().min(1),
  caption: z.string().min(1),
  hashtags: z.array(z.string().min(1)).min(3),
  thumbnailTitle: z.string().min(1),
});

export type ReelScriptRequest = z.infer<typeof reelScriptRequestSchema>;
export type ReelScriptResultParsed = z.infer<typeof reelScriptResultSchema>;
