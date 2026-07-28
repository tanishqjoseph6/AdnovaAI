"use client";

import { Download, RefreshCw } from "lucide-react";
import CopyButton from "@/components/reel-script/CopyButton";
import {
  REEL_GOAL_LABELS,
  REEL_PLATFORM_LABELS,
  type ReelScriptInput,
  type ReelScriptResult,
} from "@/lib/reel-script/types";
import { formatReelScriptForExport } from "@/lib/reel-script/normalize";

type ReelScriptResultsProps = {
  input: ReelScriptInput;
  result: ReelScriptResult;
  scriptId: string | null;
  saved: boolean;
  isRegenerating: boolean;
  onRegenerate: () => void;
};

function SectionCard({
  title,
  children,
  copyText,
}: {
  title: string;
  children: React.ReactNode;
  copyText?: string;
}) {
  return (
    <section className="glass rounded-2xl border border-white/[0.08] p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-400">
          {title}
        </h3>
        {copyText ? <CopyButton text={copyText} /> : null}
      </div>
      {children}
    </section>
  );
}

export default function ReelScriptResults({
  input,
  result,
  scriptId,
  saved,
  isRegenerating,
  onRegenerate,
}: ReelScriptResultsProps) {
  const exportText = formatReelScriptForExport(result, {
    brandName: input.brandName,
    platform: REEL_PLATFORM_LABELS[input.platform],
    duration: input.duration,
  });

  function handleExport() {
    const blob = new Blob([exportText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const slug = input.brandName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    anchor.href = url;
    anchor.download = `advora-reel-script-${slug || "export"}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <p className="text-sm font-medium text-white">
            {input.brandName} · {REEL_PLATFORM_LABELS[input.platform]} ·{" "}
            {input.duration}s · {REEL_GOAL_LABELS[input.goal]}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            {saved
              ? "Saved to workspace history"
              : "Generated successfully"}
            {scriptId ? ` · ID ${scriptId.slice(0, 8)}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <CopyButton text={exportText} label="Copy all" />
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </button>
          <button
            type="button"
            onClick={onRegenerate}
            disabled={isRegenerating}
            className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-400/20 bg-cyan-500/10 px-2.5 py-1.5 text-xs font-medium text-cyan-200 transition hover:bg-cyan-500/15 disabled:cursor-wait disabled:opacity-60"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isRegenerating ? "animate-spin" : ""}`}
            />
            Regenerate
          </button>
        </div>
      </div>

      <SectionCard
        title="5 Hook Variations"
        copyText={result.hooks.map((hook, index) => `${index + 1}. ${hook}`).join("\n")}
      >
        <ol className="space-y-3">
          {result.hooks.map((hook, index) => (
            <li
              key={`${index}-${hook.slice(0, 24)}`}
              className="flex gap-3 rounded-xl border border-white/[0.06] bg-black/20 px-3 py-3"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-xs font-semibold text-violet-200">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-relaxed text-zinc-200">{hook}</p>
                <div className="mt-2">
                  <CopyButton text={hook} />
                </div>
              </div>
            </li>
          ))}
        </ol>
      </SectionCard>

      <SectionCard
        title="Scroll-Stopping Opening"
        copyText={result.scrollStoppingOpening}
      >
        <p className="text-base leading-relaxed text-white">
          {result.scrollStoppingOpening}
        </p>
      </SectionCard>

      <SectionCard title="Scene-by-Scene Script">
        <div className="space-y-4">
          {result.scenes.map((scene) => {
            const sceneCopy = [
              `Scene ${scene.sceneNumber} (${scene.timestamp})`,
              `Visual: ${scene.visual}`,
              `Camera: ${scene.cameraDirection}`,
              `On-screen text: ${scene.onScreenText || "—"}`,
              `Voice-over: ${scene.voiceOver || "—"}`,
              `B-roll: ${scene.bRoll}`,
            ].join("\n");

            return (
              <article
                key={scene.sceneNumber}
                className="rounded-xl border border-white/[0.06] bg-black/20 p-4"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-white">
                    Scene {scene.sceneNumber}{" "}
                    <span className="font-normal text-zinc-500">
                      · {scene.timestamp}
                    </span>
                  </p>
                  <CopyButton text={sceneCopy} />
                </div>
                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-zinc-500">
                      Visual
                    </dt>
                    <dd className="mt-1 text-zinc-200">{scene.visual}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-zinc-500">
                      Camera
                    </dt>
                    <dd className="mt-1 text-zinc-200">
                      {scene.cameraDirection}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-zinc-500">
                      On-screen text
                    </dt>
                    <dd className="mt-1 text-zinc-200">
                      {scene.onScreenText || "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-zinc-500">
                      B-roll
                    </dt>
                    <dd className="mt-1 text-zinc-200">{scene.bRoll}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-xs uppercase tracking-wider text-zinc-500">
                      Voice-over
                    </dt>
                    <dd className="mt-1 text-zinc-200">
                      {scene.voiceOver || "—"}
                    </dd>
                  </div>
                </dl>
              </article>
            );
          })}
        </div>
      </SectionCard>

      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard title="Voice-Over Script" copyText={result.voiceOverScript}>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-200">
            {result.voiceOverScript}
          </p>
        </SectionCard>
        <SectionCard title="CTA" copyText={result.cta}>
          <p className="text-lg font-semibold text-white">{result.cta}</p>
        </SectionCard>
        <SectionCard title="Caption" copyText={result.caption}>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-200">
            {result.caption}
          </p>
        </SectionCard>
        <SectionCard
          title="Hashtags"
          copyText={result.hashtags.join(" ")}
        >
          <div className="flex flex-wrap gap-2">
            {result.hashtags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2.5 py-1 text-xs text-cyan-200"
              >
                {tag}
              </span>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Thumbnail Title" copyText={result.thumbnailTitle}>
        <p className="text-2xl font-semibold tracking-tight text-white">
          {result.thumbnailTitle}
        </p>
      </SectionCard>
    </div>
  );
}
