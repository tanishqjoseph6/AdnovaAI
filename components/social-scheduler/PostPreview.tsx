"use client";

import PlatformIcon from "@/components/social-scheduler/PlatformIcon";
import {
  PLATFORM_META,
  type SocialConnection,
  type SocialPlatform,
} from "@/lib/social-scheduler/types";

type PostPreviewProps = {
  platform: SocialPlatform;
  caption: string;
  imageUrl: string | null;
  connection: SocialConnection | null;
  scheduledLabel: string;
};

export default function PostPreview({
  platform,
  caption,
  imageUrl,
  connection,
  scheduledLabel,
}: PostPreviewProps) {
  const meta = PLATFORM_META[platform];

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-black/20 text-white">
            <PlatformIcon platform={platform} className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-white">{meta.label}</p>
            <p className="text-[11px] text-zinc-500">
              {connection?.profileName ?? "Preview"}
            </p>
          </div>
        </div>
        <span className="text-[11px] text-zinc-500">{scheduledLabel}</span>
      </div>

      {imageUrl ? (
        <div className="mb-3 overflow-hidden rounded-xl border border-white/8">
          <img
            src={imageUrl}
            alt="Post preview"
            className="max-h-48 w-full object-cover"
          />
        </div>
      ) : null}

      <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
        {caption || "Your post preview will appear here."}
      </p>
    </div>
  );
}
