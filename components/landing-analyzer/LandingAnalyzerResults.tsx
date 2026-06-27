"use client";

import type { LandingPageAnalysis } from "@/lib/landing-analyzer/types";

function scoreTone(score: number): string {
  if (score >= 80) return "text-emerald-300";
  if (score >= 60) return "text-cyan-300";
  return "text-amber-300";
}

function scoreBarTone(score: number): string {
  if (score >= 80) return "bg-emerald-400";
  if (score >= 60) return "bg-cyan-400";
  return "bg-amber-400";
}

function ScoreRing({ score, label }: { score: number; label: string }) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 text-center">
      <p className={`text-2xl font-bold ${scoreTone(score)}`}>{score}</p>
      <p className="mt-1 text-xs text-zinc-500">{label}</p>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full ${scoreBarTone(score)}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

function SectionCard({
  title,
  subtitle,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`glass rounded-2xl border border-white/[0.08] p-5 sm:p-6 ${className}`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-400/90">
        {title}
      </p>
      {subtitle && (
        <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>
      )}
      <div className="mt-4">{children}</div>
    </section>
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
    return <p className="text-sm text-zinc-500">Not detected</p>;
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

function CopyList({ items, label }: { items: string[]; label: string }) {
  if (items.length === 0) {
    return <p className="text-sm text-zinc-500">No {label.toLowerCase()} generated.</p>;
  }

  return (
    <ol className="space-y-3">
      {items.map((item, index) => (
        <li
          key={`${label}-${index}`}
          className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm leading-relaxed text-zinc-200"
        >
          <span className="mr-2 text-xs font-semibold text-violet-300">
            {index + 1}.
          </span>
          {item}
        </li>
      ))}
    </ol>
  );
}

export default function LandingAnalyzerResults({
  analysis,
}: {
  analysis: LandingPageAnalysis;
}) {
  const { scores, suggestions, ad_strategy: ads } = analysis;

  return (
    <div className="space-y-6">
      <section className="glass relative overflow-hidden rounded-2xl border border-white/[0.08] p-6 sm:p-8">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-600/[0.08] via-transparent to-cyan-500/[0.06]" />
        <div className="relative text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Overall conversion score
          </p>
          <p
            className={`mt-3 text-5xl font-bold sm:text-6xl ${scoreTone(scores.conversion_score)}`}
          >
            {scores.conversion_score}
            <span className="text-2xl text-zinc-500">/100</span>
          </p>
          <p className="mt-2 truncate text-sm text-zinc-400">{analysis.url}</p>
        </div>

        <div className="relative mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ScoreRing score={scores.hero_score} label="Hero score" />
          <ScoreRing score={scores.cta_score} label="CTA score" />
          <ScoreRing score={scores.trust_score} label="Trust score" />
          <ScoreRing score={scores.offer_score} label="Offer score" />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Website summary" subtitle={analysis.brand_product_name}>
          <p className="text-sm leading-relaxed text-zinc-300">
            {analysis.marketing_summary || "No summary available."}
          </p>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-zinc-500">Category</dt>
              <dd className="mt-0.5 text-zinc-200">
                {analysis.product_category || "Not detected"}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">Hero headline</dt>
              <dd className="mt-0.5 text-zinc-200">
                {analysis.hero_headline || "Not detected"}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">Value proposition</dt>
              <dd className="mt-0.5 text-zinc-200">
                {analysis.value_proposition || "Not detected"}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">Primary CTA</dt>
              <dd className="mt-0.5 text-zinc-200">
                {analysis.primary_cta || "Not detected"}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">Offer</dt>
              <dd className="mt-0.5 text-zinc-200">
                {analysis.offer || "Not detected"}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">Social proof</dt>
              <dd className="mt-0.5 text-zinc-200">
                {analysis.social_proof || "Not detected"}
              </dd>
            </div>
          </dl>
        </SectionCard>

        <SectionCard title="Audience & psychology">
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
                Pain points
              </p>
              <div className="mt-2">
                <BulletList items={analysis.pain_points} accent="amber" />
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
                Key USPs
              </p>
              <div className="mt-2">
                <BulletList items={analysis.key_usps} accent="emerald" />
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
        </SectionCard>

        <SectionCard title="Strengths">
          <BulletList items={analysis.strengths} accent="emerald" />
        </SectionCard>

        <SectionCard title="Weaknesses">
          <BulletList items={analysis.weaknesses} accent="amber" />
        </SectionCard>

        <SectionCard
          title="Improvement suggestions"
          className="lg:col-span-2"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                Better headline
              </p>
              <p className="mt-2 text-sm text-zinc-200">
                {suggestions.better_headline || "—"}
              </p>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                Better CTA
              </p>
              <p className="mt-2 text-sm text-zinc-200">
                {suggestions.better_cta || "—"}
              </p>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                Better offer
              </p>
              <p className="mt-2 text-sm text-zinc-200">
                {suggestions.better_offer || "—"}
              </p>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                Missing trust elements
              </p>
              <div className="mt-2">
                <BulletList items={suggestions.missing_trust_elements} accent="amber" />
              </div>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 md:col-span-2">
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                UX improvements
              </p>
              <div className="mt-2">
                <BulletList items={suggestions.ux_improvements} />
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Ad angles" className="lg:col-span-2">
          <CopyList items={ads.ad_angles} label="Ad angles" />
        </SectionCard>

        <SectionCard title="Hooks">
          <CopyList items={ads.hooks} label="Hooks" />
        </SectionCard>

        <SectionCard title="Captions">
          <CopyList items={ads.captions} label="Captions" />
        </SectionCard>

        <SectionCard title="CTAs" className="lg:col-span-2">
          <CopyList items={ads.ctas} label="CTAs" />
        </SectionCard>
      </div>
    </div>
  );
}
