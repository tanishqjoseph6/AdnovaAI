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
      <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-white">
        Generating ads...
      </div>
    );
  }

  return (
    <div className="space-y-6 text-white">

      {/* Hooks */}
      <div className="rounded-2xl border border-white/10 bg-black/20 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Hooks</h2>
          <CopyButton
            text={hooks.join("\n")}
            label="Copy Hooks"
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
      <div className="rounded-2xl border border-white/10 bg-black/20 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Captions</h2>
          <CopyButton
            text={captions.join("\n")}
            label="Copy Captions"
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
      <div className="rounded-2xl border border-white/10 bg-black/20 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">CTAs</h2>
          <CopyButton
            text={ctas.join("\n")}
            label="Copy CTAs"
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
      <div className="rounded-2xl border border-white/10 bg-black/20 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">UGC Script</h2>
          <CopyButton
            text={ugcScript}
            label="Copy Script"
          />
        </div>

        <div className="rounded-xl bg-white/5 p-4 text-sm whitespace-pre-wrap">
          {ugcScript}
        </div>
      </div>

    </div>
  );
}