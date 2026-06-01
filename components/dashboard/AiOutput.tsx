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
        <h2 className="mb-4 text-xl font-bold">Hooks</h2>

        <div className="space-y-3">
          {(hooks || []).map((hook, index) => (
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
        <h2 className="mb-4 text-xl font-bold">Captions</h2>

        <div className="space-y-3">
          {(captions || []).map((caption, index) => (
            <div
              key={index}
              className="rounded-xl bg-white/5 p-3 text-sm"
            >
              {caption}
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="rounded-2xl border border-white/10 bg-black/20 p-6">
        <h2 className="mb-4 text-xl font-bold">CTAs</h2>

        <div className="space-y-3">
          {(ctas || []).map((cta, index) => (
            <div
              key={index}
              className="rounded-xl bg-white/5 p-3 text-sm"
            >
              {cta}
            </div>
          ))}
        </div>
      </div>

      {/* Script */}
      <div className="rounded-2xl border border-white/10 bg-black/20 p-6">
        <h2 className="mb-4 text-xl font-bold">UGC Script</h2>

        <div className="rounded-xl bg-white/5 p-4 text-sm whitespace-pre-wrap">
          {ugcScript}
        </div>
      </div>
    </div>
  );
}