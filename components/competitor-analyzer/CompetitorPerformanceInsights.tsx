"use client";

import type { PerformanceInsights } from "@/lib/competitor-ad/types";
import { CompetitorExpandableSection } from "./CompetitorConfidenceBadge";

function InsightCard({
  title,
  value,
  reasoning,
  delayMs = 0,
}: {
  title: string;
  value: string;
  reasoning: string;
  delayMs?: number;
}) {
  if (!value && !reasoning) {
    return null;
  }

  return (
    <div
      className="animate-[fadeInUp_0.6s_ease-out_both] rounded-xl border border-white/[0.08] bg-white/[0.03] p-4"
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-400/80">
        {title}
      </p>
      <p className="mt-2 text-lg font-semibold text-white">{value || "—"}</p>
      {reasoning && (
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">{reasoning}</p>
      )}
    </div>
  );
}

export default function CompetitorPerformanceInsights({
  insights,
}: {
  insights: PerformanceInsights;
}) {
  const hasContent = Object.values(insights).some(
    (metric) => metric.value || metric.reasoning
  );

  if (!hasContent) {
    return null;
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-white">Performance insights</h2>
        <p className="mt-1 text-sm text-zinc-500">
          AI-estimated metrics with reasoning for this specific ad
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <InsightCard
          title="Estimated conversion potential"
          value={insights.conversion_potential.value}
          reasoning={insights.conversion_potential.reasoning}
          delayMs={60}
        />
        <InsightCard
          title="Estimated CTR"
          value={insights.estimated_ctr.value}
          reasoning={insights.estimated_ctr.reasoning}
          delayMs={120}
        />
        <InsightCard
          title="Estimated scroll stop rate"
          value={insights.scroll_stop_rate.value}
          reasoning={insights.scroll_stop_rate.reasoning}
          delayMs={180}
        />
        <InsightCard
          title="Estimated purchase intent"
          value={insights.purchase_intent.value}
          reasoning={insights.purchase_intent.reasoning}
          delayMs={240}
        />
        <InsightCard
          title="Estimated engagement probability"
          value={insights.engagement_probability.value}
          reasoning={insights.engagement_probability.reasoning}
          delayMs={300}
          />
      </div>

      <CompetitorExpandableSection title="View all insight reasoning" defaultOpen={false}>
        <div className="space-y-4 text-sm text-zinc-300">
          {(
            [
              ["Conversion potential", insights.conversion_potential],
              ["Estimated CTR", insights.estimated_ctr],
              ["Scroll stop rate", insights.scroll_stop_rate],
              ["Purchase intent", insights.purchase_intent],
              ["Engagement probability", insights.engagement_probability],
            ] as const
          ).map(([label, metric]) => (
            <div key={label}>
              <p className="font-medium text-white">
                {label}: {metric.value || "—"}
              </p>
              {metric.reasoning && (
                <p className="mt-1 text-zinc-400">{metric.reasoning}</p>
              )}
            </div>
          ))}
        </div>
      </CompetitorExpandableSection>
    </section>
  );
}
