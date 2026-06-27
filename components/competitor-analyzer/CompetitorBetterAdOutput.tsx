"use client";

import CopyButton from "@/components/dashboard/CopyButton";
import type { BetterCompetitorAd } from "@/lib/competitor-ad/types";

export default function CompetitorBetterAdOutput({
  data,
}: {
  data: BetterCompetitorAd;
}) {
  const { hooks, captions, ctas, ugcScript } = data;

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

      <div className="rounded-2xl border border-white/10 bg-black/20 p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-base font-bold text-white">Hooks</h3>
          <CopyButton text={hooks.join("\n")} label="Copy Hooks" />
        </div>
        <div className="space-y-3">
          {hooks.map((hook, index) => (
            <div key={`hook-${index}`} className="rounded-xl bg-white/5 p-3 text-sm text-zinc-200">
              {hook}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/20 p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-base font-bold text-white">Captions</h3>
          <CopyButton text={captions.join("\n")} label="Copy Captions" />
        </div>
        <div className="space-y-3">
          {captions.map((caption, index) => (
            <div key={`caption-${index}`} className="rounded-xl bg-white/5 p-3 text-sm text-zinc-200">
              {caption}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/20 p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-base font-bold text-white">CTAs</h3>
          <CopyButton text={ctas.join("\n")} label="Copy CTAs" />
        </div>
        <div className="space-y-3">
          {ctas.map((cta, index) => (
            <div key={`cta-${index}`} className="rounded-xl bg-white/5 p-3 text-sm text-zinc-200">
              {cta}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/20 p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-base font-bold text-white">UGC Script</h3>
          <CopyButton text={ugcScript} label="Copy Script" />
        </div>
        <div className="whitespace-pre-wrap rounded-xl bg-white/5 p-4 text-sm text-zinc-200">
          {ugcScript}
        </div>
      </div>
    </div>
  );
}
