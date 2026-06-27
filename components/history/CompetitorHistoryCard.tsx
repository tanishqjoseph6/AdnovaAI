"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import CollapsibleSection from "@/components/history/CollapsibleSection";
import DeleteGenerationDialog from "@/components/history/DeleteGenerationDialog";
import GenerationDate from "@/components/history/GenerationDate";
import { getCompetitorScoreColor } from "@/lib/competitor-ad/scores";
import type { CompetitorAnalysisRecord } from "@/lib/competitor-ad/types";
import type { PlanBadge } from "@/lib/history/types";
import { getCreditsUsedLabel, joinSection } from "@/lib/history/utils";

type CompetitorHistoryCardProps = {
  record: CompetitorAnalysisRecord;
  planBadge: PlanBadge;
  index: number;
  onDelete: (id: string) => Promise<void>;
};

function Badge({
  children,
  variant,
}: {
  children: React.ReactNode;
  variant: "plan-free" | "plan-pro" | "type-competitor" | "has-better-ad";
}) {
  const styles = {
    "plan-free": "border-zinc-500/30 bg-zinc-500/10 text-zinc-300",
    "plan-pro": "border-violet-500/30 bg-violet-500/10 text-violet-300",
    "type-competitor":
      "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
    "has-better-ad":
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[variant]}`}
    >
      {children}
    </span>
  );
}

export default function CompetitorHistoryCard({
  record,
  planBadge,
  index,
  onDelete,
}: CompetitorHistoryCardProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { analysis, better_ad: betterAd } = record;
  const overallScore = analysis.scores.overall_score;
  const scoreColor = getCompetitorScoreColor(overallScore);
  const isPro = planBadge === "Pro";
  const title =
    [analysis.brand, analysis.product].filter(Boolean).join(" · ") ||
    record.image_name ||
    "Competitor ad analysis";

  const insightsCopy = [
    analysis.hook_analysis && `Hook: ${analysis.hook_analysis}`,
    analysis.cta_analysis && `CTA: ${analysis.cta_analysis}`,
    analysis.suggestions.what_makes_successful.length > 0 &&
      `Strengths:\n${analysis.suggestions.what_makes_successful.map((item) => `- ${item}`).join("\n")}`,
    analysis.suggestions.weaknesses.length > 0 &&
      `Weaknesses:\n${analysis.suggestions.weaknesses.map((item) => `- ${item}`).join("\n")}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const handleDelete = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await onDelete(record.id);
      setDeleteOpen(false);
    } catch {
      setDeleteError("Failed to delete. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <motion.article
        layout
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: -8 }}
        transition={{ duration: 0.35, delay: index * 0.04 }}
        className="group glass rounded-2xl border border-white/[0.08] p-5 shadow-lg shadow-black/20 transition hover:border-white/[0.14] hover:shadow-xl hover:shadow-violet-500/5 sm:p-6"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-semibold tracking-tight text-white sm:text-xl">
              {title}
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              {analysis.platform || "Unknown platform"}
              {record.image_name ? ` · ${record.image_name}` : ""}
            </p>
            <p className="mt-1.5 flex items-center gap-1.5 text-sm text-zinc-500">
              <svg
                className="h-4 w-4 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <GenerationDate iso={record.created_at} />
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <Badge variant={isPro ? "plan-pro" : "plan-free"}>{planBadge}</Badge>
            <Badge variant="type-competitor">Competitor Analysis</Badge>
            {betterAd && <Badge variant="has-better-ad">Better Ad Generated</Badge>}
            <span
              className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-xs font-semibold"
              style={{ color: scoreColor }}
            >
              Score {overallScore}/100
            </span>
          </div>
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {(
            [
              ["Hook", analysis.scores.hook_score],
              ["CTA", analysis.scores.cta_score],
              ["Visual", analysis.scores.visual_score],
              ["Copy", analysis.scores.copy_score],
              ["Trust", analysis.scores.trust_score],
              ["Offer", analysis.scores.offer_score],
              ["Psychology", analysis.scores.psychology_score],
            ] as const
          ).map(([label, score]) => (
            <div
              key={label}
              className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-2 py-1.5 text-center"
            >
              <p
                className="text-sm font-semibold"
                style={{ color: getCompetitorScoreColor(score) }}
              >
                {score}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-zinc-500">
                {label}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-5 space-y-3 border-t border-white/[0.06] pt-5">
          <CollapsibleSection
            title="Analysis insights"
            copyText={insightsCopy}
            copyLabel="Copy insights"
            defaultOpen={false}
          >
            <div className="space-y-4 text-sm text-zinc-300">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Hook analysis
                </p>
                <p className="mt-1">{analysis.hook_analysis || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  CTA analysis
                </p>
                <p className="mt-1">{analysis.cta_analysis || "—"}</p>
              </div>
              {analysis.suggestions.what_makes_successful.length > 0 && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Strengths
                  </p>
                  <ul className="mt-2 list-inside list-disc space-y-1">
                    {analysis.suggestions.what_makes_successful.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {analysis.suggestions.weaknesses.length > 0 && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Weaknesses
                  </p>
                  <ul className="mt-2 list-inside list-disc space-y-1">
                    {analysis.suggestions.weaknesses.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CollapsibleSection>

          {betterAd && (
            <>
              <CollapsibleSection
                title="Better hooks"
                copyText={joinSection(betterAd.hooks)}
                copyLabel="Copy hooks"
              >
                <pre className="whitespace-pre-wrap text-sm text-zinc-300">
                  {joinSection(betterAd.hooks)}
                </pre>
              </CollapsibleSection>
              <CollapsibleSection
                title="Better captions"
                copyText={joinSection(betterAd.captions)}
                copyLabel="Copy captions"
              >
                <pre className="whitespace-pre-wrap text-sm text-zinc-300">
                  {joinSection(betterAd.captions)}
                </pre>
              </CollapsibleSection>
              <CollapsibleSection
                title="Better CTAs"
                copyText={joinSection(betterAd.ctas)}
                copyLabel="Copy CTAs"
              >
                <pre className="whitespace-pre-wrap text-sm text-zinc-300">
                  {joinSection(betterAd.ctas)}
                </pre>
              </CollapsibleSection>
              {betterAd.ugcScript && (
                <CollapsibleSection
                  title="UGC script"
                  copyText={betterAd.ugcScript}
                  copyLabel="Copy script"
                >
                  <pre className="whitespace-pre-wrap text-sm text-zinc-300">
                    {betterAd.ugcScript}
                  </pre>
                </CollapsibleSection>
              )}
            </>
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-5">
          <p className="text-xs text-zinc-500">
            Analysis: free
            {betterAd ? ` · Better ad: ${getCreditsUsedLabel(isPro)}` : ""}
          </p>
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-1.5 text-xs font-medium text-red-400 opacity-0 transition group-hover:opacity-100 hover:bg-red-500/10 focus:opacity-100"
          >
            Delete
          </button>
        </div>

        {deleteError && (
          <p className="mt-3 text-sm text-red-400" role="alert">
            {deleteError}
          </p>
        )}
      </motion.article>

      <DeleteGenerationDialog
        open={deleteOpen}
        productName={title}
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteOpen(false)}
        isDeleting={isDeleting}
      />
    </>
  );
}
