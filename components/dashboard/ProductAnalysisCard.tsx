"use client";

import { Pencil, RefreshCw, Sparkles } from "lucide-react";
import {
  arrayToLines,
  linesToArray,
  type ProductAnalysis,
} from "@/lib/product-analysis/types";
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

function ReadOnlyList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-zinc-500">Not specified</p>;
  }

  return (
    <ul className="space-y-1.5">
      {items.map((item) => (
        <li
          key={item}
          className="flex items-start gap-2 text-sm leading-relaxed text-zinc-300"
        >
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400/80" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function FieldBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
        {label}
      </p>
      <div className="mt-2">{children}</div>
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
              Used to improve your generated ads
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

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
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
            <FieldBlock label="Recommended tone">
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
            <div className="sm:col-span-2" />
            <FieldBlock label="Key features (one per line)">
              <textarea
                rows={4}
                value={arrayToLines(analysis.key_features)}
                disabled={controlsDisabled}
                onChange={(e) =>
                  onChange({
                    ...analysis,
                    key_features: linesToArray(e.target.value),
                  })
                }
                className={textareaClassName}
              />
            </FieldBlock>
            <FieldBlock label="Target audience (one per line)">
              <textarea
                rows={4}
                value={arrayToLines(analysis.target_audience)}
                disabled={controlsDisabled}
                onChange={(e) =>
                  onChange({
                    ...analysis,
                    target_audience: linesToArray(e.target.value),
                  })
                }
                className={textareaClassName}
              />
            </FieldBlock>
            <FieldBlock label="Suggested ad angles (one per line)">
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
                className={`${textareaClassName} sm:col-span-2`}
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
            <FieldBlock label="Recommended tone">
              <p className="text-sm text-zinc-300">
                {analysis.recommended_tone || "Not specified"}
              </p>
            </FieldBlock>
            <div className="sm:col-span-2" />
            <FieldBlock label="Key features">
              <ReadOnlyList items={analysis.key_features} />
            </FieldBlock>
            <FieldBlock label="Target audience">
              <ReadOnlyList items={analysis.target_audience} />
            </FieldBlock>
            <FieldBlock label="Suggested ad angles">
              <ReadOnlyList items={analysis.suggested_ad_angles} />
            </FieldBlock>
          </>
        )}
      </div>
    </div>
  );
}
