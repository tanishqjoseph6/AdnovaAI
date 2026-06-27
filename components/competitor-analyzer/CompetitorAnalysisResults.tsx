"use client";

import { useEffect, useState } from "react";
import { getCompetitorScoreColor } from "@/lib/competitor-ad/scores";
import type {
  CompetitorAdAnalysis,
  CompetitorScoreExplanations,
} from "@/lib/competitor-ad/types";
import CompetitorConfidenceBadge, {
  CompetitorExpandableSection,
} from "./CompetitorConfidenceBadge";
import CompetitorComparisonSection from "./CompetitorComparisonSection";
import CompetitorPerformanceInsights from "./CompetitorPerformanceInsights";

function useAnimatedScore(target: number, durationMs = 900): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let frame = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs]);

  return value;
}

function ScoreTile({
  label,
  score,
  explanation,
  delayMs = 0,
}: {
  label: string;
  score: number;
  explanation: string;
  delayMs?: number;
}) {
  const animated = useAnimatedScore(score);
  const color = getCompetitorScoreColor(score);

  return (
    <div
      className="animate-[fadeInUp_0.6s_ease-out_both] rounded-xl border border-white/[0.08] bg-white/[0.03] p-4"
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <div className="text-center">
        <p className="text-2xl font-bold" style={{ color }}>
          {animated}
        </p>
        <p className="mt-1 text-xs text-zinc-500">{label}</p>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full transition-[width] duration-1000 ease-out"
            style={{
              width: `${animated}%`,
              backgroundColor: color,
              transitionDelay: `${delayMs}ms`,
            }}
          />
        </div>
      </div>
      {explanation && (
        <p className="mt-3 text-left text-xs leading-relaxed text-zinc-400">
          {explanation}
        </p>
      )}
    </div>
  );
}

function BulletList({
  items,
  accent = "cyan",
}: {
  items: string[];
  accent?: "cyan" | "emerald" | "amber" | "fuchsia";
}) {
  const dotClass = {
    cyan: "bg-cyan-400/80",
    emerald: "bg-emerald-400/80",
    amber: "bg-amber-400/80",
    fuchsia: "bg-fuchsia-400/80",
  }[accent];

  if (items.length === 0) {
    return <p className="text-sm text-zinc-500">None identified</p>;
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2 text-sm text-zinc-300">
          <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${dotClass}`} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

const SCORE_TILES: {
  label: string;
  scoreKey: keyof CompetitorScoreExplanations;
  getScore: (analysis: CompetitorAdAnalysis) => number;
}[] = [
  {
    label: "Hook score",
    scoreKey: "hook_score",
    getScore: (a) => a.scores.hook_score,
  },
  {
    label: "CTA score",
    scoreKey: "cta_score",
    getScore: (a) => a.scores.cta_score,
  },
  {
    label: "Visual score",
    scoreKey: "visual_score",
    getScore: (a) => a.scores.visual_score,
  },
  {
    label: "Copy score",
    scoreKey: "copy_score",
    getScore: (a) => a.scores.copy_score,
  },
  {
    label: "Trust score",
    scoreKey: "trust_score",
    getScore: (a) => a.scores.trust_score,
  },
  {
    label: "Offer score",
    scoreKey: "offer_score",
    getScore: (a) => a.scores.offer_score,
  },
  {
    label: "Psychology score",
    scoreKey: "psychology_score",
    getScore: (a) => a.scores.psychology_score,
  },
  {
    label: "Urgency / FOMO",
    scoreKey: "urgency_fomo_score",
    getScore: (a) => a.urgency_fomo_score,
  },
];

export default function CompetitorAnalysisResults({
  analysis,
}: {
  analysis: CompetitorAdAnalysis;
}) {
  const { scores, suggestions, score_explanations: explanations } = analysis;
  const overallColor = getCompetitorScoreColor(scores.overall_score);
  const animatedOverall = useAnimatedScore(scores.overall_score, 1100);

  return (
    <div className="space-y-6">
      <CompetitorConfidenceBadge confidence={analysis.analysis_confidence} />

      <section className="glass relative overflow-hidden rounded-2xl border border-violet-500/20 p-5 sm:p-8">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-600/[0.08] via-transparent to-cyan-500/[0.06]" />
        <div className="relative text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Overall ad score
          </p>
          <p className="mt-3 text-5xl font-bold sm:text-6xl" style={{ color: overallColor }}>
            {animatedOverall}
            <span className="text-2xl text-zinc-500">/100</span>
          </p>
          <p className="mt-2 text-sm text-zinc-400">
            {analysis.brand || "Unknown brand"} · {analysis.platform || "Unknown platform"}
          </p>
        </div>

        <div className="relative mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {SCORE_TILES.map((tile, index) => (
            <ScoreTile
              key={tile.scoreKey}
              label={tile.label}
              score={tile.getScore(analysis)}
              explanation={explanations[tile.scoreKey]}
              delayMs={60 + index * 60}
            />
          ))}
        </div>
      </section>

      <CompetitorComparisonSection analysis={analysis} />

      <CompetitorPerformanceInsights insights={analysis.performance_insights} />

      <div className="grid gap-4 lg:grid-cols-2">
        <CompetitorExpandableSection title="Ad breakdown" defaultOpen>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-zinc-500">Brand</dt>
              <dd className="mt-0.5 text-zinc-200">{analysis.brand || "Unknown"}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Product</dt>
              <dd className="mt-0.5 text-zinc-200">{analysis.product || "Unknown"}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Platform</dt>
              <dd className="mt-0.5 text-zinc-200">{analysis.platform || "Unknown"}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Ad objective</dt>
              <dd className="mt-0.5 text-zinc-200">{analysis.ad_objective || "Not detected"}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Hook analysis</dt>
              <dd className="mt-0.5 text-zinc-200">{analysis.hook_analysis || "—"}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">CTA analysis</dt>
              <dd className="mt-0.5 text-zinc-200">{analysis.cta_analysis || "—"}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Copywriting quality</dt>
              <dd className="mt-0.5 text-zinc-200">{analysis.copywriting_quality || "—"}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Visual quality</dt>
              <dd className="mt-0.5 text-zinc-200">{analysis.visual_quality || "—"}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Offer quality</dt>
              <dd className="mt-0.5 text-zinc-200">{analysis.offer_quality || "—"}</dd>
            </div>
          </dl>
        </CompetitorExpandableSection>

        <CompetitorExpandableSection title="Audience & psychology" defaultOpen>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                Target audience
              </p>
              <div className="mt-2">
                <BulletList items={analysis.target_audience} />
              </div>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                Emotional triggers
              </p>
              <div className="mt-2">
                <BulletList items={analysis.emotional_triggers} accent="fuchsia" />
              </div>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                Marketing psychology
              </p>
              <div className="mt-2">
                <BulletList items={analysis.marketing_psychology} accent="emerald" />
              </div>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                Trust signals
              </p>
              <div className="mt-2">
                <BulletList items={analysis.trust_signals} />
              </div>
            </div>
          </div>
        </CompetitorExpandableSection>

        <CompetitorExpandableSection title="What makes this ad successful">
          <BulletList items={suggestions.what_makes_successful} accent="emerald" />
        </CompetitorExpandableSection>

        <CompetitorExpandableSection title="Weaknesses">
          <BulletList items={suggestions.weaknesses} accent="amber" />
        </CompetitorExpandableSection>

        <CompetitorExpandableSection title="How to outperform it">
          <BulletList items={suggestions.how_to_outperform} accent="cyan" />
        </CompetitorExpandableSection>

        <CompetitorExpandableSection title="Better hook suggestions">
          <BulletList items={suggestions.better_hook_suggestions} accent="fuchsia" />
        </CompetitorExpandableSection>

        <CompetitorExpandableSection title="Better CTA suggestions">
          <BulletList items={suggestions.better_cta_suggestions} />
        </CompetitorExpandableSection>

        <CompetitorExpandableSection title="Better offer suggestions">
          <BulletList items={suggestions.better_offer_suggestions} accent="emerald" />
        </CompetitorExpandableSection>
      </div>
    </div>
  );
}
