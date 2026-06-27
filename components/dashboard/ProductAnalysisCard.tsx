"use client";

import { Pencil, RefreshCw, Sparkles } from "lucide-react";
import {
  arrayToLines,
  isLowConfidence,
  linesToArray,
  type ProductAnalysis,
} from "@/lib/product-analysis/types";
import EditableBulletList from "./EditableBulletList";
import EditableChipList from "./EditableChipList";
import LoadingSpinner from "./LoadingSpinner";

type ProductAnalysisCardProps = {
  analysis: ProductAnalysis;
  isEditing: boolean;
  isAnalyzing: boolean;
  analysisError: string | null;
  disabled?: boolean;
  onChange: (analysis: ProductAnalysis) => void;
  onEditToggle: () => void;
  onRegenerate: () => void;
};

const inputClassName =
  "w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/10 disabled:opacity-50";

const textareaClassName =
  "w-full resize-y rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/10 disabled:opacity-50";

function FieldBlock({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
        {label}
      </p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function ConfidenceMeter({
  analysis,
  isAnalyzing,
}: {
  analysis: ProductAnalysis;
  isAnalyzing: boolean;
}) {
  if (isAnalyzing) {
    return null;
  }

  const displayScore = Math.round(analysis.confidence_score);
  const toneClass =
    displayScore >= 80
      ? "text-emerald-300"
      : displayScore >= 60
        ? "text-cyan-300"
        : "text-amber-300";

  return (
    <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-3 sm:px-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-zinc-400">
          Confidence:{" "}
          <span className={`font-semibold ${toneClass}`}>{displayScore}%</span>
        </p>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            displayScore >= 80
              ? "bg-emerald-400"
              : displayScore >= 60
                ? "bg-cyan-400"
                : "bg-amber-400"
          }`}
          style={{ width: `${displayScore}%` }}
          role="progressbar"
          aria-valuenow={displayScore}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="AI confidence score"
        />
      </div>
      {isLowConfidence(analysis) && (
        <p className="mt-2 text-sm text-amber-200">
          Please review the detected information before generating ads.
        </p>
      )}
    </div>
  );
}

export default function ProductAnalysisCard({
  analysis,
  isEditing,
  isAnalyzing,
  analysisError,
  disabled = false,
  onChange,
  onEditToggle,
  onRegenerate,
}: ProductAnalysisCardProps) {
  const controlsDisabled = disabled || isAnalyzing;

  return (
    <div className="glass rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-500/[0.06] to-cyan-500/[0.04] p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/30 to-cyan-500/20 text-violet-300">
            <Sparkles className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-white">AI product analysis</h3>
            <p className="text-xs text-zinc-500">
              Tags, USPs, audience and tone power your ads
            </p>
          </div>
        </div>

        <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
          <button
            type="button"
            disabled={controlsDisabled}
            onClick={onEditToggle}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-zinc-300 transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden />
            {isEditing ? "Done editing" : "Edit analysis"}
          </button>
          <button
            type="button"
            disabled={controlsDisabled}
            onClick={onRegenerate}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs font-medium text-cyan-200 transition hover:border-cyan-400/50 hover:bg-cyan-500/15 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
          >
            {isAnalyzing ? (
              <LoadingSpinner className="h-3.5 w-3.5 text-cyan-300" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" aria-hidden />
            )}
            Regenerate analysis
          </button>
        </div>
      </div>

      {isAnalyzing && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 py-2.5 text-sm text-cyan-200">
          <LoadingSpinner className="h-4 w-4 text-cyan-300" />
          Analyzing product image...
        </div>
      )}

      {analysisError && !isAnalyzing && (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-200"
        >
          {analysisError}
        </div>
      )}

      <ConfidenceMeter analysis={analysis} isAnalyzing={isAnalyzing} />

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        {isEditing ? (
          <>
            <FieldBlock label="Product name">
              <input
                type="text"
                value={analysis.product_name}
                disabled={controlsDisabled}
                onChange={(e) =>
                  onChange({ ...analysis, product_name: e.target.value })
                }
                className={inputClassName}
              />
            </FieldBlock>
            <FieldBlock label="Category">
              <input
                type="text"
                value={analysis.category}
                disabled={controlsDisabled}
                onChange={(e) =>
                  onChange({ ...analysis, category: e.target.value })
                }
                className={inputClassName}
              />
            </FieldBlock>
            <FieldBlock label="Recommended tone" className="sm:col-span-2">
              <input
                type="text"
                value={analysis.recommended_tone}
                disabled={controlsDisabled}
                onChange={(e) =>
                  onChange({ ...analysis, recommended_tone: e.target.value })
                }
                className={inputClassName}
              />
            </FieldBlock>
            <FieldBlock label="Suggested ad angles (one per line)" className="sm:col-span-2">
              <textarea
                rows={4}
                value={arrayToLines(analysis.suggested_ad_angles)}
                disabled={controlsDisabled}
                onChange={(e) =>
                  onChange({
                    ...analysis,
                    suggested_ad_angles: linesToArray(e.target.value),
                  })
                }
                className={textareaClassName}
              />
            </FieldBlock>
          </>
        ) : (
          <>
            <FieldBlock label="Product name">
              <p className="text-sm font-medium text-white">
                {analysis.product_name || "Not specified"}
              </p>
            </FieldBlock>
            <FieldBlock label="Category">
              <p className="text-sm text-zinc-300">
                {analysis.category || "Not specified"}
              </p>
            </FieldBlock>
            <FieldBlock label="Recommended tone" className="sm:col-span-2">
              <p className="text-sm text-zinc-300">
                {analysis.recommended_tone || "Not specified"}
              </p>
            </FieldBlock>
            <FieldBlock label="Suggested ad angles" className="sm:col-span-2">
              {analysis.suggested_ad_angles.length > 0 ? (
                <ul className="space-y-1.5">
                  {analysis.suggested_ad_angles.map((angle) => (
                    <li
                      key={angle}
                      className="flex items-start gap-2 text-sm text-zinc-300"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-fuchsia-400/80" />
                      <span>{angle}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-zinc-500">Not specified</p>
              )}
            </FieldBlock>
          </>
        )}

        <FieldBlock label="Product tags" className="sm:col-span-2">
          <EditableChipList
            items={analysis.product_tags}
            onChange={(product_tags) => onChange({ ...analysis, product_tags })}
            disabled={controlsDisabled}
            placeholder="Add a tag..."
            addLabel="Add tag"
          />
        </FieldBlock>

        <FieldBlock label="Unique selling points" className="sm:col-span-2">
          <EditableBulletList
            items={analysis.usps}
            onChange={(usps) => onChange({ ...analysis, usps })}
            disabled={controlsDisabled}
            placeholder="e.g. Long Battery Life"
          />
        </FieldBlock>

        <FieldBlock label="Target audience" className="sm:col-span-2">
          <EditableChipList
            items={analysis.target_audience}
            onChange={(target_audience) =>
              onChange({ ...analysis, target_audience })
            }
            disabled={controlsDisabled}
            placeholder="Add an audience..."
            addLabel="Add audience"
          />
        </FieldBlock>
      </div>
    </div>
  );
}
