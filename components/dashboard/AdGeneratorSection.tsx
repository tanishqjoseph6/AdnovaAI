"use client";

import { useRef } from "react";
import { useAdGenerator } from "@/hooks/useAdGenerator";
import ProductUpload from "./ProductUpload";
import AiOutput from "./AiOutput";

type AdGeneratorSectionProps = {
  compact?: boolean;
};

const emptyOutput = {
  hooks: [] as string[],
  captions: [] as string[],
  ugcScript: "",
};

export default function AdGeneratorSection({
  compact = false,
}: AdGeneratorSectionProps) {
  const outputRef = useRef<HTMLDivElement>(null);
  const { state, generate, reset, isLoading, hasOutput } = useAdGenerator();

  const handleGenerate = async ({
    productDescription,
  }: {
    productDescription: string;
  }) => {
    try {
      await generate(productDescription);
      requestAnimationFrame(() => {
        outputRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    } catch {
      // Error state handled in useAdGenerator; ProductUpload shows message via prop
    }
  };

  const outputData =
    state.status === "success"
      ? state.data
      : emptyOutput;

  const formError = state.status === "error" ? state.message : null;

  return (
    <div className="w-full min-w-0">
      <ProductUpload
        compact={compact}
        onGenerate={handleGenerate}
        isGenerating={isLoading}
        externalError={formError}
        onClearError={reset}
      />

      {hasOutput && (
        <div ref={outputRef} className="scroll-mt-24">
          <AiOutput
            data={outputData}
            isLoading={isLoading}
            showCtas={false}
          />
        </div>
      )}

      {state.status === "error" && !hasOutput && (
        <div
          role="alert"
          className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-5"
        >
          <p className="text-sm font-medium text-red-300">Generation failed</p>
          <p className="mt-1 text-sm text-red-400/90">{state.message}</p>
          <button
            type="button"
            onClick={reset}
            className="mt-4 rounded-lg border border-red-500/30 px-4 py-2 text-sm text-red-300 transition hover:bg-red-500/10"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
