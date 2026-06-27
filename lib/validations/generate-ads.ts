import { z } from "zod";

export const generateAdsRequestSchema = z.object({
  productDescription: z
    .string()
    .trim()
    .min(10, "Product description must be at least 10 characters")
    .max(4000, "Product description must be at most 4000 characters"),
});

export const generateAdsResponseSchema = z.object({
  hooks: z.array(z.string().min(1)),
  captions: z.array(z.string().min(1)),
  ctas: z.array(z.string()).default([]),
  ugcScript: z.string().min(1),
});

export type GenerateAdsRequest = z.infer<typeof generateAdsRequestSchema>;
export type GenerateAdsResponse = z.infer<typeof generateAdsResponseSchema>;
