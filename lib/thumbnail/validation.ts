import { z } from "zod";
import {
  THUMBNAIL_FORMATS,
  THUMBNAIL_VARIATION_COUNTS,
} from "@/lib/thumbnail/types";

const hexColorSchema = z
  .string()
  .trim()
  .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Invalid hex color");

const optionalBase64Schema = z
  .string()
  .trim()
  .max(7_000_000, "Image payload is too large")
  .nullable()
  .optional();

export const thumbnailRequestSchema = z.object({
  format: z.enum(THUMBNAIL_FORMATS),
  prompt: z
    .string()
    .trim()
    .min(10, "Prompt must be at least 10 characters")
    .max(2000, "Prompt must be at most 2000 characters"),
  productUrl: z
    .string()
    .trim()
    .max(2048, "Product URL must be at most 2048 characters")
    .optional()
    .or(z.literal("")),
  productImageBase64: optionalBase64Schema,
  productImageMimeType: z
    .enum(["image/jpeg", "image/png", "image/webp"])
    .nullable()
    .optional(),
  logoBase64: optionalBase64Schema,
  logoMimeType: z
    .enum(["image/jpeg", "image/png", "image/webp"])
    .nullable()
    .optional(),
  brandName: z
    .string()
    .trim()
    .min(1, "Brand name is required")
    .max(120, "Brand name must be at most 120 characters"),
  brandColors: z.object({
    primary: hexColorSchema,
    secondary: hexColorSchema,
    accent: hexColorSchema,
  }),
  variationCount: z.coerce
    .number()
    .int()
    .refine(
      (value): value is 2 | 3 | 4 =>
        (THUMBNAIL_VARIATION_COUNTS as readonly number[]).includes(value),
      "Variation count must be 2, 3, or 4"
    ),
  templateId: z.string().uuid().nullable().optional(),
});

export const thumbnailTemplateSaveSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Template name is required")
    .max(80, "Template name must be at most 80 characters"),
  format: z.enum(THUMBNAIL_FORMATS),
  prompt: z
    .string()
    .trim()
    .min(10, "Prompt must be at least 10 characters")
    .max(2000, "Prompt must be at most 2000 characters"),
  brandName: z
    .string()
    .trim()
    .min(1, "Brand name is required")
    .max(120, "Brand name must be at most 120 characters"),
  brandColors: z.object({
    primary: hexColorSchema,
    secondary: hexColorSchema,
    accent: hexColorSchema,
  }),
  productUrl: z
    .string()
    .trim()
    .max(2048)
    .optional()
    .or(z.literal("")),
  previewImageUrl: z.string().url().nullable().optional(),
  thumbnailId: z.string().uuid().nullable().optional(),
});

export type ThumbnailRequest = z.infer<typeof thumbnailRequestSchema>;
export type ThumbnailTemplateSaveRequest = z.infer<
  typeof thumbnailTemplateSaveSchema
>;
