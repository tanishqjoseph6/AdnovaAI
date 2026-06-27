"use client";

import CopyButton from "@/components/dashboard/CopyButton";
import type { BetterCompetitorAd } from "@/lib/competitor-ad/types";
import { CompetitorExpandableSection } from "./CompetitorConfidenceBadge";

function OutputBlock({
  title,
  items,
  copyLabel,
  singleText,
}: {
  title: string;
  items?: string[];
  copyLabel: string;
  singleText?: string;
}) {
  const copyText = singleText ?? items?.join("\n") ?? "";
  const hasContent = Boolean(copyText.trim());

  if (!hasContent) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-base font-bold text-white">{title}</h3>
        <CopyButton text={copyText} label={copyLabel} />
      </div>
      {items && items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={`${title}-${index}`}
              className="rounded-xl bg-white/5 p-3 text-sm text-zinc-200"
            >
              {item}
            </div>
          ))}
        </div>
      ) : (
        <div className="whitespace-pre-wrap rounded-xl bg-white/5 p-4 text-sm text-zinc-200">
          {singleText}
        </div>
      )}
    </div>
  );
}

export default function CompetitorBetterAdOutput({
  data,
}: {
  data: BetterCompetitorAd;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white sm:text-xl">
            Your better ad version
          </h2>
          <p className="text-sm text-zinc-500">
            Generated to outperform the competitor creative
          </p>
        </div>
      </div>

      <OutputBlock title="Hooks" items={data.hooks} copyLabel="Copy Hooks" />
      <OutputBlock
        title="Headlines"
        items={data.headlines}
        copyLabel="Copy Headlines"
      />
      <OutputBlock
        title="Captions"
        items={data.captions}
        copyLabel="Copy Captions"
      />
      <OutputBlock title="CTAs" items={data.ctas} copyLabel="Copy CTAs" />
      <OutputBlock title="Offers" items={data.offers} copyLabel="Copy Offers" />

      {data.emotional_angle && (
        <OutputBlock
          title="Emotional angle"
          singleText={data.emotional_angle}
          copyLabel="Copy Angle"
        />
      )}

      {data.target_audience.length > 0 && (
        <CompetitorExpandableSection title="Target audience" defaultOpen>
          <ul className="space-y-2 text-sm text-zinc-300">
            {data.target_audience.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400/80" />
                {item}
              </li>
            ))}
          </ul>
        </CompetitorExpandableSection>
      )}

      {data.visual_suggestions.length > 0 && (
        <CompetitorExpandableSection title="Visual suggestions" defaultOpen>
          <ul className="space-y-2 text-sm text-zinc-300">
            {data.visual_suggestions.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-fuchsia-400/80" />
                {item}
              </li>
            ))}
          </ul>
        </CompetitorExpandableSection>
      )}

      <OutputBlock
        title="UGC Script"
        singleText={data.ugcScript}
        copyLabel="Copy Script"
      />
    </div>
  );
}
