"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAdGenerator } from "@/hooks/useAdGenerator";
import { useAdScore } from "@/hooks/useAdScore";
import { useCredits } from "@/hooks/useCredits";
import { CREDITS_ERROR_CODE } from "@/lib/credits/constants";
import { dispatchNoCreditsEvent } from "@/lib/credits/client-events";
import type { ProductAnalysis } from "@/lib/product-analysis/types";
import ProductUpload from "./ProductUpload";
import AiOutput from "./AiOutput";
import AdScoreCard from "./AdScoreCard";

type AdGeneratorSectionProps = {
  compact?: boolean;
};

const emptyOutput = {
  hooks: [] as string[],
  captions: [] as string[],
  ctas: [] as string[],
  ugcScript: "",
};

export default function AdGeneratorSection({
  compact = false,
}: AdGeneratorSectionProps) {
  const router = useRouter();
  const outputRef = useRef<HTMLDivElement>(null);
  const lastInputRef = useRef<{
    productDescription: string;
    productAnalysis?: ProductAnalysis | null;
  } | null>(null);
  const scoredSignatureRef = useRef<string | null>(null);
  const { refresh } = useCredits();

  const { state, generate, clearError, reset, isLoading, hasOutput, outputData } =
    useAdGenerator({
      onSuccess: (data) => {
        void refresh();
        if (data.generatedAt) {
          const detail = {
            generatedAt: data.generatedAt,
            remainingCredits: data.credits,
          };
          window.dispatchEvent(
            new CustomEvent("advora:generation-success", {
              detail,
            })
          );
        }
        router.refresh();
      },
      onNoCredits: () => dispatchNoCreditsEvent(),
    });

  const {
    analyze: analyzeAdScore,
    reset: resetAdScore,
    isLoading: isScoring,
    analysis: adScoreAnalysis,
    error: adScoreError,
  } = useAdScore();

  useEffect(() => {
    if (state.status !== "success" || !state.data || !lastInputRef.current) {
      return;
    }

    const signature = JSON.stringify(state.data);
    if (scoredSignatureRef.current === signature) {
      return;
    }

    scoredSignatureRef.current = signature;

    void analyzeAdScore({
      productDescription: lastInputRef.current.productDescription,
      hooks: state.data.hooks,
      captions: state.data.captions,
      ctas: state.data.ctas,
      ugcScript: state.data.ugcScript,
    });
  }, [state, analyzeAdScore]);

  const handleGenerate = async ({
    productDescription,
    productAnalysis,
  }: {
    productDescription: string;
    productAnalysis?: ProductAnalysis | null;
  }) => {
    lastInputRef.current = { productDescription, productAnalysis };
    scoredSignatureRef.current = null;
    resetAdScore();

    try {
      await generate(productDescription, productAnalysis);
      requestAnimationFrame(() => {
        outputRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    } catch {
      // Error state handled in useAdGenerator
    }
  };

  const formError = state.status === "error" ? state.message : null;
  const isNoCredits =
    state.status === "error" && state.code === CREDITS_ERROR_CODE;

  return (
    <div className="w-full min-w-0">
      <ProductUpload
        compact={compact}
        onGenerate={handleGenerate}
        isGenerating={isLoading}
        externalError={isNoCredits ? null : formError}
        onClearError={clearError}
      />

      {hasOutput && (
        <div ref={outputRef} className="scroll-mt-24">
          <AiOutput
            data={outputData ?? emptyOutput}
            isLoading={isLoading}
          />
          {!isLoading && (
            <AdScoreCard
              analysis={adScoreAnalysis}
              isLoading={isScoring}
              error={adScoreError}
            />
          )}
        </div>
      )}

      {state.status === "error" && !hasOutput && !isNoCredits && (
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
