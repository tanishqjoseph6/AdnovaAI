"use client";

import { Download } from "lucide-react";
import CopyButton from "@/components/thumbnail/CopyButton";
import {
  THUMBNAIL_FORMAT_DIMENSIONS,
  type ThumbnailVariation,
} from "@/lib/thumbnail/types";

type ThumbnailPreviewCardProps = {
  variation: ThumbnailVariation;
  format: keyof typeof THUMBNAIL_FORMAT_DIMENSIONS;
  index: number;
};

export default function ThumbnailPreviewCard({
  variation,
  format,
  index,
}: ThumbnailPreviewCardProps) {
  const dims = THUMBNAIL_FORMAT_DIMENSIONS[format];
  const aspectClass =
    format === "reel_cover"
      ? "aspect-[9/16] max-h-[420px]"
      : format === "instagram_cover" || format === "product"
        ? "aspect-square"
        : "aspect-video";

  async function handleDownload() {
    try {
      const response = await fetch(variation.imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `advora-thumbnail-${index + 1}-${dims.width}x${dims.height}.png`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch {
      window.open(variation.imageUrl, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <article className="group overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] shadow-lg shadow-black/20 transition hover:border-white/[0.14] hover:shadow-violet-500/10">
      <div className={`relative overflow-hidden bg-[#090712] ${aspectClass}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={variation.imageUrl}
          alt={`Thumbnail variation ${index + 1}: ${variation.headline}`}
          className="h-full w-full object-cover"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
      </div>

      <div className="space-y-3 p-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
            Variation {index + 1}
          </p>
          <h3 className="mt-1 text-base font-semibold text-white">
            {variation.headline}
          </h3>
          <p className="mt-1 text-sm text-cyan-300">{variation.cta}</p>
          <p className="mt-2 text-xs text-zinc-500">
            {dims.width}×{dims.height} · HD
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <CopyButton text={variation.headline} label="Copy headline" />
          <CopyButton text={variation.cta} label="Copy CTA" />
          <button
            type="button"
            onClick={() => void handleDownload()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1.5 text-xs font-medium text-cyan-200 transition hover:border-cyan-400/50 hover:bg-cyan-500/15"
          >
            <Download className="h-3.5 w-3.5" />
            Download HD
          </button>
        </div>
      </div>
    </article>
  );
}
