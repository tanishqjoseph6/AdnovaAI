"use client";

import { useEffect, useState } from "react";
import {
  getScoreColor,
  getScoreLabel,
} from "@/lib/landing-analyzer/scores";

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

function ScoreProgressBar({
  score,
  animatedScore,
  delayMs = 0,
}: {
  score: number;
  animatedScore: number;
  delayMs?: number;
}) {
  const color = getScoreColor(score);

  return (
    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
      <div
        className="h-full rounded-full transition-[width] duration-1000 ease-out"
        style={{
          width: `${animatedScore}%`,
          backgroundColor: color,
          transitionDelay: `${delayMs}ms`,
        }}
      />
    </div>
  );
}

function ScoreRing({
  score,
  label,
  delayMs = 0,
}: {
  score: number;
  label: string;
  delayMs?: number;
}) {
  const animatedScore = useAnimatedScore(score);
  const color = getScoreColor(score);
  const labelText = getScoreLabel(score);
  const circumference = 2 * Math.PI * 36;
  const strokeDashoffset =
    circumference - (animatedScore / 100) * circumference;

  return (
    <div
      className="animate-[fadeInUp_0.6s_ease-out_both] rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 text-center"
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <div className="relative mx-auto h-20 w-20">
        <svg
          className="h-20 w-20 -rotate-90"
          viewBox="0 0 80 80"
          aria-hidden
        >
          <circle
            cx="40"
            cy="40"
            r="36"
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="6"
          />
          <circle
            cx="40"
            cy="40"
            r="36"
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-[stroke-dashoffset] duration-1000 ease-out"
            style={{ transitionDelay: `${delayMs}ms` }}
          />
        </svg>
        <p
          className="absolute inset-0 flex items-center justify-center text-xl font-bold"
          style={{ color }}
        >
          {animatedScore}
        </p>
      </div>
      <p className="mt-2 text-xs text-zinc-500">{label}</p>
      <p className="mt-0.5 text-[11px] font-medium" style={{ color }}>
        {labelText}
      </p>
      <ScoreProgressBar
        score={score}
        animatedScore={animatedScore}
        delayMs={delayMs}
      />
    </div>
  );
}

export function OverallScoreDisplay({ score }: { score: number }) {
  const animatedScore = useAnimatedScore(score, 1100);
  const color = getScoreColor(score);
  const labelText = getScoreLabel(score);
  const circumference = 2 * Math.PI * 52;
  const strokeDashoffset =
    circumference - (animatedScore / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
        Overall conversion score
      </p>
      <div className="relative mt-4 h-36 w-36 sm:h-40 sm:w-40">
        <svg
          className="h-full w-full -rotate-90"
          viewBox="0 0 120 120"
          aria-hidden
        >
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
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-[stroke-dashoffset] duration-1100 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-4xl font-bold sm:text-5xl" style={{ color }}>
            {animatedScore}
          </p>
          <p className="text-sm text-zinc-500">/100</p>
        </div>
      </div>
      <p
        className="mt-2 text-sm font-semibold"
        style={{ color }}
      >
        {labelText}
      </p>
    </div>
  );
}

export { ScoreRing };
