"use client";

import { getCompetitorScoreColor } from "@/lib/competitor-ad/scores";
import {
  getComparisonOverallForCompetitor,
  type CompetitorAdAnalysis,
} from "@/lib/competitor-ad/types";

function ComparisonRow({
  label,
  competitorScore,
  improvedScore,
}: {
  label: string;
  competitorScore: number;
  improvedScore: number;
}) {
  const delta = improvedScore - competitorScore;
  const deltaColor =
    delta > 0 ? "#22C55E" : delta < 0 ? "#EF4444" : "#A1A1AA";

  return (
    <div className="border-b border-white/[0.06] py-3 text-sm last:border-0 sm:grid sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:gap-3">
      <span className="block text-zinc-400">{label}</span>
      <div className="mt-2 flex items-center justify-between gap-4 sm:mt-0 sm:contents">
        <span
          className="font-semibold tabular-nums sm:text-right"
          style={{ color: getCompetitorScoreColor(competitorScore) }}
        >
          <span className="mr-1 text-[10px] uppercase tracking-wider text-zinc-600 sm:hidden">
            Comp
          </span>
          {competitorScore}
        </span>
        <span
          className="font-semibold tabular-nums sm:text-right"
          style={{ color: getCompetitorScoreColor(improvedScore) }}
        >
          <span className="mr-1 text-[10px] uppercase tracking-wider text-zinc-600 sm:hidden">
            AI
          </span>
          {improvedScore}
          {delta !== 0 && (
            <span className="ml-1.5 text-xs" style={{ color: deltaColor }}>
              ({delta > 0 ? "+" : ""}
              {delta})
            </span>
          )}
        </span>
      </div>
    </div>
  );
}

export default function CompetitorComparisonSection({
  analysis,
}: {
  analysis: CompetitorAdAnalysis;
}) {
  const { scores, improved_version: improved } = analysis;
  const competitorOverall = getComparisonOverallForCompetitor(analysis);
  const improvement = improved.overall_improvement;
  const improvementColor = improvement > 0 ? "#22C55E" : "#FACC15";

  return (
    <section className="glass overflow-hidden rounded-2xl border border-violet-500/20">
      <div className="border-b border-white/[0.06] bg-gradient-to-r from-violet-600/10 via-transparent to-cyan-500/10 px-5 py-4 sm:px-6">
        <h2 className="text-base font-semibold text-white sm:text-lg">
          Competitor vs Advora AI Improved Version
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Predicted performance if you apply AI recommendations
        </p>
      </div>

      <div className="grid gap-0 lg:grid-cols-2">
        <div className="border-b border-white/[0.06] p-5 sm:p-6 lg:border-b-0 lg:border-r">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Competitor Advertisement
          </p>
          <p
            className="mt-3 text-4xl font-bold"
            style={{ color: getCompetitorScoreColor(competitorOverall) }}
          >
            {competitorOverall}
            <span className="text-lg text-zinc-500">/100</span>
          </p>
          <p className="mt-1 text-xs text-zinc-500">Overall score</p>
        </div>

        <div className="p-5 sm:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-400/90">
            Advora AI Improved Version
          </p>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <p
              className="text-4xl font-bold"
              style={{ color: getCompetitorScoreColor(improved.overall_score) }}
            >
              {improved.overall_score}
              <span className="text-lg text-zinc-500">/100</span>
            </p>
            {improvement !== 0 && (
              <span
                className="rounded-full border px-3 py-1 text-sm font-semibold"
                style={{
                  color: improvementColor,
                  borderColor: `${improvementColor}40`,
                  backgroundColor: `${improvementColor}15`,
                }}
              >
                {improvement > 0 ? "+" : ""}
                {improvement} Overall Score
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-zinc-500">Predicted score</p>
        </div>
      </div>

      <div className="border-t border-white/[0.06] px-5 py-2 sm:px-6">
        <div className="hidden py-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-600 sm:grid sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:gap-3">
          <span>Dimension</span>
          <span className="text-right">Competitor</span>
          <span className="text-right">AI Improved</span>
        </div>
        <ComparisonRow
          label="Hook"
          competitorScore={scores.hook_score}
          improvedScore={improved.hook_score}
        />
        <ComparisonRow
          label="CTA"
          competitorScore={scores.cta_score}
          improvedScore={improved.cta_score}
        />
        <ComparisonRow
          label="Offer"
          competitorScore={scores.offer_score}
          improvedScore={improved.offer_score}
        />
        <ComparisonRow
          label="Psychology"
          competitorScore={scores.psychology_score}
          improvedScore={improved.psychology_score}
        />
        <ComparisonRow
          label="Urgency"
          competitorScore={analysis.urgency_fomo_score}
          improvedScore={improved.urgency_fomo_score}
        />
      </div>

      {improved.why_better && (
        <div className="border-t border-white/[0.06] bg-white/[0.02] px-5 py-4 sm:px-6">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Why the AI version performs better
          </p>
          <p className="mt-2 text-sm leading-relaxed text-zinc-300">
            {improved.why_better}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {improved.improved_hook && (
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                <p className="text-[10px] uppercase tracking-wider text-fuchsia-400/80">
                  Improved hook
                </p>
                <p className="mt-1 text-sm text-zinc-300">{improved.improved_hook}</p>
              </div>
            )}
            {improved.improved_cta && (
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                <p className="text-[10px] uppercase tracking-wider text-cyan-400/80">
                  Improved CTA
                </p>
                <p className="mt-1 text-sm text-zinc-300">{improved.improved_cta}</p>
              </div>
            )}
            {improved.improved_offer && (
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                <p className="text-[10px] uppercase tracking-wider text-emerald-400/80">
                  Improved offer
                </p>
                <p className="mt-1 text-sm text-zinc-300">{improved.improved_offer}</p>
              </div>
            )}
            {improved.improved_psychology && (
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                <p className="text-[10px] uppercase tracking-wider text-violet-400/80">
                  Improved psychology
                </p>
                <p className="mt-1 text-sm text-zinc-300">
                  {improved.improved_psychology}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
