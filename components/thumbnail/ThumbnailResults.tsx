"use client";

import { useState } from "react";
import { BookmarkPlus, RefreshCw } from "lucide-react";
import ThumbnailPreviewCard from "@/components/thumbnail/ThumbnailPreviewCard";
import CopyButton from "@/components/thumbnail/CopyButton";
import {
  THUMBNAIL_FORMAT_LABELS,
  type ThumbnailInput,
  type ThumbnailResult,
} from "@/lib/thumbnail/types";

type ThumbnailResultsProps = {
  input: ThumbnailInput;
  result: ThumbnailResult;
  thumbnailId: string | null;
  saved: boolean;
  isRegenerating: boolean;
  onRegenerate: () => void;
  onSaveTemplate: (name: string) => Promise<void>;
};

export default function ThumbnailResults({
  input,
  result,
  thumbnailId,
  saved,
  isRegenerating,
  onRegenerate,
  onSaveTemplate,
}: ThumbnailResultsProps) {
  const [templateName, setTemplateName] = useState("");
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [templateMessage, setTemplateMessage] = useState<string | null>(null);

  async function handleSaveTemplate() {
    const name = templateName.trim();
    if (!name) return;
    setIsSavingTemplate(true);
    setTemplateMessage(null);
    try {
      await onSaveTemplate(name);
      setTemplateMessage("Template saved to your workspace.");
      setTemplateName("");
    } catch (error) {
      setTemplateMessage(
        error instanceof Error ? error.message : "Failed to save template."
      );
    } finally {
      setIsSavingTemplate(false);
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-400">
            Results
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-white">
            {THUMBNAIL_FORMAT_LABELS[result.format]}
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            {result.variations.length} HD variation
            {result.variations.length === 1 ? "" : "s"}
            {saved && thumbnailId ? " · saved to history" : ""}
          </p>
        </div>

        <button
          type="button"
          onClick={onRegenerate}
          disabled={isRegenerating}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-zinc-200 transition hover:border-white/20 hover:bg-white/[0.08] disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${isRegenerating ? "animate-spin" : ""}`}
          />
          Regenerate
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {result.variations.map((variation, index) => (
          <ThumbnailPreviewCard
            key={variation.id}
            variation={variation}
            format={result.format}
            index={index}
          />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
          <h3 className="text-sm font-semibold text-white">
            Suggested headlines
          </h3>
          <ul className="mt-3 space-y-2">
            {result.suggestedHeadlines.map((headline) => (
              <li
                key={headline}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2"
              >
                <span className="text-sm text-zinc-300">{headline}</span>
                <CopyButton text={headline} label="Copy" />
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
          <h3 className="text-sm font-semibold text-white">Suggested CTAs</h3>
          <ul className="mt-3 space-y-2">
            {result.suggestedCtas.map((cta) => (
              <li
                key={cta}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2"
              >
                <span className="text-sm text-zinc-300">{cta}</span>
                <CopyButton text={cta} label="Copy" />
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
        <h3 className="text-sm font-semibold text-white">Save as template</h3>
        <p className="mt-1 text-sm text-zinc-500">
          Reuse this setup later from your thumbnail workspace.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={templateName}
            onChange={(event) => setTemplateName(event.target.value)}
            placeholder={`${input.brandName} ${THUMBNAIL_FORMAT_LABELS[input.format]}`}
            className="w-full rounded-xl border border-white/10 bg-[#0a0618] px-3 py-2.5 text-sm text-white outline-none transition focus:border-cyan-400/40"
          />
          <button
            type="button"
            disabled={isSavingTemplate || !templateName.trim()}
            onClick={() => void handleSaveTemplate()}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2.5 text-sm font-medium text-cyan-200 transition hover:bg-cyan-500/15 disabled:opacity-50"
          >
            <BookmarkPlus className="h-4 w-4" />
            {isSavingTemplate ? "Saving…" : "Save template"}
          </button>
        </div>
        {templateMessage ? (
          <p className="mt-3 text-sm text-zinc-400">{templateMessage}</p>
        ) : null}
      </div>
    </section>
  );
}
