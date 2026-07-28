"use client";

import { useRef } from "react";
import { ImagePlus, Loader2, Sparkles, Upload } from "lucide-react";
import {
  THUMBNAIL_FORMAT_DIMENSIONS,
  THUMBNAIL_FORMAT_LABELS,
  THUMBNAIL_FORMATS,
  THUMBNAIL_VARIATION_COUNTS,
  type ThumbnailFormat,
  type ThumbnailInput,
  type ThumbnailTemplate,
  type ThumbnailVariationCount,
} from "@/lib/thumbnail/types";

type ThumbnailFormProps = {
  value: ThumbnailInput;
  isLoading: boolean;
  templates: ThumbnailTemplate[];
  onChange: <K extends keyof ThumbnailInput>(
    key: K,
    value: ThumbnailInput[K]
  ) => void;
  onSubmit: () => void;
  onApplyTemplate: (template: ThumbnailTemplate) => void;
  onImportBrandKit: () => void;
  isImportingBrandKit?: boolean;
};

async function readFileAsBase64(
  file: File
): Promise<{ base64: string; mimeType: string }> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return {
    base64: btoa(binary),
    mimeType: file.type,
  };
}

export default function ThumbnailForm({
  value,
  isLoading,
  templates,
  onChange,
  onSubmit,
  onApplyTemplate,
  onImportBrandKit,
  isImportingBrandKit = false,
}: ThumbnailFormProps) {
  const productInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  async function handleImageUpload(
    file: File | null,
    kind: "product" | "logo"
  ) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      return;
    }

    const payload = await readFileAsBase64(file);
    if (kind === "product") {
      onChange("productImageBase64", payload.base64);
      onChange("productImageMimeType", payload.mimeType as ThumbnailInput["productImageMimeType"]);
    } else {
      onChange("logoBase64", payload.base64);
      onChange("logoMimeType", payload.mimeType as ThumbnailInput["logoMimeType"]);
    }
  }

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        if (!isLoading) onSubmit();
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-400">
          Describe the thumbnail, attach assets, and Advora will generate multiple
          HD variations.
        </p>
        <button
          type="button"
          onClick={onImportBrandKit}
          disabled={isLoading || isImportingBrandKit}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-zinc-200 transition hover:border-white/20 hover:bg-white/[0.08] disabled:opacity-50"
        >
          {isImportingBrandKit ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
          )}
          Use Brand Kit
        </button>
      </div>

      {templates.length > 0 ? (
        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Saved templates
          </label>
          <div className="flex flex-wrap gap-2">
            {templates.map((template) => (
              <button
                key={template.id}
                type="button"
                disabled={isLoading}
                onClick={() => onApplyTemplate(template)}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-zinc-300 transition hover:border-cyan-400/40 hover:text-white disabled:opacity-50"
              >
                {template.name}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="space-y-2">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Thumbnail format
          </span>
          <select
            value={value.format}
            disabled={isLoading}
            onChange={(event) =>
              onChange("format", event.target.value as ThumbnailFormat)
            }
            className="w-full rounded-xl border border-white/10 bg-[#0a0618] px-3 py-2.5 text-sm text-white outline-none transition focus:border-cyan-400/40"
          >
            {THUMBNAIL_FORMATS.map((format) => (
              <option key={format} value={format}>
                {THUMBNAIL_FORMAT_LABELS[format]} (
                {THUMBNAIL_FORMAT_DIMENSIONS[format].aspect})
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Variations
          </span>
          <select
            value={value.variationCount}
            disabled={isLoading}
            onChange={(event) =>
              onChange(
                "variationCount",
                Number(event.target.value) as ThumbnailVariationCount
              )
            }
            className="w-full rounded-xl border border-white/10 bg-[#0a0618] px-3 py-2.5 text-sm text-white outline-none transition focus:border-cyan-400/40"
          >
            {THUMBNAIL_VARIATION_COUNTS.map((count) => (
              <option key={count} value={count}>
                {count} variations
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block space-y-2">
        <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          Creative prompt
        </span>
        <textarea
          value={value.prompt}
          disabled={isLoading}
          rows={4}
          placeholder="e.g. Bold YouTube thumbnail for a skincare serum launch — glowing skin, glass bottle, urgent offer vibe"
          onChange={(event) => onChange("prompt", event.target.value)}
          className="w-full resize-y rounded-xl border border-white/10 bg-[#0a0618] px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-cyan-400/40"
        />
      </label>

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="space-y-2">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Brand name
          </span>
          <input
            type="text"
            value={value.brandName}
            disabled={isLoading}
            onChange={(event) => onChange("brandName", event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#0a0618] px-3 py-2.5 text-sm text-white outline-none transition focus:border-cyan-400/40"
            placeholder="Advora"
          />
        </label>

        <label className="space-y-2">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Product URL
          </span>
          <input
            type="url"
            value={value.productUrl}
            disabled={isLoading}
            onChange={(event) => onChange("productUrl", event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#0a0618] px-3 py-2.5 text-sm text-white outline-none transition focus:border-cyan-400/40"
            placeholder="https://..."
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {(
          [
            ["primary", "Primary"],
            ["secondary", "Secondary"],
            ["accent", "Accent"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="space-y-2">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              {label} color
            </span>
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#0a0618] px-2 py-1.5">
              <input
                type="color"
                value={value.brandColors[key]}
                disabled={isLoading}
                onChange={(event) =>
                  onChange("brandColors", {
                    ...value.brandColors,
                    [key]: event.target.value,
                  })
                }
                className="h-9 w-10 cursor-pointer rounded border-0 bg-transparent"
              />
              <input
                type="text"
                value={value.brandColors[key]}
                disabled={isLoading}
                onChange={(event) =>
                  onChange("brandColors", {
                    ...value.brandColors,
                    [key]: event.target.value,
                  })
                }
                className="w-full bg-transparent text-sm text-white outline-none"
              />
            </div>
          </label>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Product image
          </span>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => productInputRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-8 text-sm text-zinc-400 transition hover:border-cyan-400/30 hover:text-zinc-200 disabled:opacity-50"
          >
            <Upload className="h-4 w-4" />
            {value.productImageBase64
              ? "Product image attached"
              : "Upload product image"}
          </button>
          <input
            ref={productInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(event) =>
              void handleImageUpload(event.target.files?.[0] ?? null, "product")
            }
          />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Logo
          </span>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => logoInputRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-8 text-sm text-zinc-400 transition hover:border-cyan-400/30 hover:text-zinc-200 disabled:opacity-50"
          >
            <ImagePlus className="h-4 w-4" />
            {value.logoBase64 ? "Logo attached" : "Upload logo"}
          </button>
          <input
            ref={logoInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(event) =>
              void handleImageUpload(event.target.files?.[0] ?? null, "logo")
            }
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading || value.prompt.trim().length < 10 || !value.brandName.trim()}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating thumbnails…
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Generate thumbnails
          </>
        )}
      </button>
    </form>
  );
}
