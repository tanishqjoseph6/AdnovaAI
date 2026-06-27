"use client";

import { useEffect, useState } from "react";
import { BarChart3, Sparkles } from "lucide-react";
import { getAdScoreColor } from "@/lib/ad-score/scores";
import type { AdScoreAnalysis } from "@/lib/ad-score/types";
import LoadingSpinner from "./LoadingSpinner";

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

function OverallScoreRing({ score }: { score: number }) {
  const animatedOverall = useAnimatedScore(score, 1100);
  const overallColor = getAdScoreColor(score);
  const overallCircumference = 2 * Math.PI * 52;
  const overallOffset =
    overallCircumference - (animatedOverall / 100) * overallCircumference;

  return (
    <div className="relative mt-4 flex flex-col items-center">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
        Overall score
      </p>
      <div className="relative mt-4 h-36 w-36 sm:h-40 sm:w-40">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120" aria-hidden>
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="8"
          />
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke={overallColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={overallCircumference}
            strokeDashoffset={overallOffset}
            className="transition-[stroke-dashoffset] duration-1100 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-4xl font-bold sm:text-5xl" style={{ color: overallColor }}>
            {animatedOverall}
          </p>
          <p className="text-sm text-zinc-500">/100</p>
        </div>
      </div>
    </div>
  );
}

function ScoreTile({
  label,
  score,
  delayMs = 0,
}: {
  label: string;
  score: number;
  delayMs?: number;
}) {
  const animated = useAnimatedScore(score);
  const color = getAdScoreColor(score);
  const circumference = 2 * Math.PI * 30;
  const strokeDashoffset = circumference - (animated / 100) * circumference;

  return (
    <div
      className="animate-[fadeInUp_0.6s_ease-out_both] rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 text-center"
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <div className="relative mx-auto h-16 w-16">
        <svg className="h-16 w-16 -rotate-90" viewBox="0 0 68 68" aria-hidden>
          <circle
            cx="34"
            cy="34"
            r="30"
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="5"
          />
          <circle
            cx="34"
            cy="34"
            r="30"
            fill="none"
            stroke={color}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-[stroke-dashoffset] duration-1000 ease-out"
            style={{ transitionDelay: `${delayMs}ms` }}
          />
        </svg>
        <p
          className="absolute inset-0 flex items-center justify-center text-lg font-bold"
          style={{ color }}
        >
          {animated}
        </p>
      </div>
      <p className="mt-2 text-xs text-zinc-500">{label}</p>
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
  );
}

function BulletList({
  items,
  accent,
}: {
  items: string[];
  accent: "emerald" | "amber" | "cyan";
}) {
  const dotClass = {
    emerald: "bg-emerald-400/80",
    amber: "bg-amber-400/80",
    cyan: "bg-cyan-400/80",
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

function AdScoreSkeleton() {
  return (
    <div className="mt-4 animate-pulse space-y-6">
      <div className="glass h-40 rounded-2xl border border-white/[0.08]" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-32 rounded-xl border border-white/[0.08] bg-white/[0.03]"
          />
        ))}
      </div>
      <div className="h-48 rounded-2xl border border-white/[0.08] bg-white/[0.03]" />
    </div>
  );
}

type AdScoreCardProps = {
  analysis: AdScoreAnalysis | null;
  isLoading: boolean;
  error: string | null;
};

export default function AdScoreCard({
  analysis,
  isLoading,
  error,
}: AdScoreCardProps) {
  if (isLoading) {
    return (
      <div className="mt-8">
        <div className="flex items-center gap-2 text-sm text-cyan-200">
          <LoadingSpinner className="h-4 w-4 text-cyan-300" />
          Analyzing ad performance...
        </div>
        <AdScoreSkeleton />
      </div>
    );
  }

  if (error && !analysis) {
    return (
      <div
        role="alert"
        className="mt-8 rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-200"
      >
        {error}
      </div>
    );
  }

  if (!analysis) {
    return null;
  }

  const { scores, improvements } = analysis;

  return (
    <section className="mt-8 space-y-6">
      <div className="glass relative overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/[0.06] to-cyan-500/[0.04] p-5 sm:p-8">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-600/[0.08] via-transparent to-cyan-500/[0.06]" />

        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/30 via-violet-500/30 to-fuchsia-500/20">
              <BarChart3 className="h-5 w-5 text-cyan-400" strokeWidth={1.75} />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-white sm:text-xl">
                AI Ad Score
              </h2>
              <p className="text-sm text-zinc-500">
                Conversion potential of your generated copy
              </p>
            </div>
          </div>
        </div>

        <div className="relative">
          <OverallScoreRing score={scores.overall_score} />
        </div>

        <div className="relative mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <ScoreTile label="Hook score" score={scores.hook_score} delayMs={80} />
          <ScoreTile label="CTA score" score={scores.cta_score} delayMs={140} />
          <ScoreTile label="Emotional score" score={scores.emotional_score} delayMs={200} />
          <ScoreTile label="Clarity score" score={scores.clarity_score} delayMs={260} />
          <ScoreTile label="Conversion score" score={scores.conversion_score} delayMs={320} />
          <ScoreTile label="Brand fit score" score={scores.brand_fit_score} delayMs={380} />
        </div>
      </div>

      <div className="glass rounded-2xl border border-white/[0.08] p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-violet-300" strokeWidth={1.75} />
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-300/90">
            AI improvement insights
          </p>
        </div>

        <div className="mt-5 grid gap-6 lg:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Strengths
            </p>
            <div className="mt-2">
              <BulletList items={improvements.strengths} accent="emerald" />
            </div>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Weaknesses
            </p>
            <div className="mt-2">
              <BulletList items={improvements.weaknesses} accent="amber" />
            </div>
          </div>
          <div className="lg:col-span-2">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Actionable suggestions
            </p>
            <div className="mt-2">
              <BulletList items={improvements.actionable_suggestions} accent="cyan" />
            </div>
          </div>
          {improvements.estimated_conversion_improvement && (
            <div className="lg:col-span-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wider text-emerald-300/90">
                Estimated conversion improvement
              </p>
              <p className="mt-1.5 text-sm font-medium text-emerald-100">
                {improvements.estimated_conversion_improvement}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
