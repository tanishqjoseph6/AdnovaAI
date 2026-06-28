"use client";

import CopyButton from "./CopyButton";

type AiOutputProps = {
  data?: {
    hooks?: string[];
    captions?: string[];
    ctas?: string[];
    ugcScript?: string;
  };
  isLoading?: boolean;
};

export default function AiOutput({
  data,
  isLoading = false,
}: AiOutputProps) {
  const hooks = data?.hooks || [];
  const captions = data?.captions || [];
  const ctas = data?.ctas || [];
  const ugcScript = data?.ugcScript || "";

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-white sm:p-6">
        Generating ads...
      </div>
    );
  }

  return (
    <div className="space-y-6 text-white">

      {/* Hooks */}
      <div className="rounded-2xl border border-white/10 bg-black/20 p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="min-w-0 text-lg font-bold sm:text-xl">Hooks</h2>
          <CopyButton
            text={hooks.join("\n")}
            label="Copy Hooks"
            className="shrink-0"
          />
        </div>

        <div className="space-y-3">
          {hooks.map((hook, index) => (
            <div
              key={index}
              className="rounded-xl bg-white/5 p-3 text-sm"
            >
              {hook}
            </div>
          ))}
        </div>
      </div>

      {/* Captions */}
      <div className="rounded-2xl border border-white/10 bg-black/20 p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="min-w-0 text-lg font-bold sm:text-xl">Captions</h2>
          <CopyButton
            text={captions.join("\n")}
            label="Copy Captions"
            className="shrink-0"
          />
        </div>

        <div className="space-y-3">
          {captions.map((caption, index) => (
            <div
              key={index}
              className="rounded-xl bg-white/5 p-3 text-sm"
            >
              {caption}
            </div>
          ))}
        </div>
      </div>

      {/* CTAs */}
      <div className="rounded-2xl border border-white/10 bg-black/20 p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="min-w-0 text-lg font-bold sm:text-xl">CTAs</h2>
          <CopyButton
            text={ctas.join("\n")}
            label="Copy CTAs"
            className="shrink-0"
          />
        </div>

        <div className="space-y-3">
          {ctas.map((cta, index) => (
            <div
              key={index}
              className="rounded-xl bg-white/5 p-3 text-sm"
            >
              {cta}
            </div>
          ))}
        </div>
      </div>

      {/* UGC Script */}
      <div className="rounded-2xl border border-white/10 bg-black/20 p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="min-w-0 text-lg font-bold sm:text-xl">UGC Script</h2>
          <CopyButton
            text={ugcScript}
            label="Copy Script"
            className="shrink-0"
          />
        </div>

        <div className="overflow-x-auto rounded-xl bg-white/5 p-4 text-sm whitespace-pre-wrap break-words">
          {ugcScript}
        </div>
      </div>

    </div>
  );
}