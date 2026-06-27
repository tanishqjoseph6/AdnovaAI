"use client";

import { useCallback, useState } from "react";
import { Sparkles, Target } from "lucide-react";
import { analyzeCompetitorAd } from "@/lib/api/analyze-competitor-client";
import {
  generateBetterCompetitorAd,
  isNoCreditsError,
} from "@/lib/api/generate-better-competitor-client";
import type {
  BetterCompetitorAd,
  CompetitorAdAnalysis,
} from "@/lib/competitor-ad/types";
import { useCredits } from "@/hooks/useCredits";
import UpgradeModal from "@/components/credits/UpgradeModal";
import LoadingSpinner from "@/components/dashboard/LoadingSpinner";
import CompetitorAdUpload from "./CompetitorAdUpload";
import CompetitorAnalysisResults from "./CompetitorAnalysisResults";
import CompetitorBetterAdOutput from "./CompetitorBetterAdOutput";
import CompetitorAnalyzerSkeleton from "./CompetitorAnalyzerSkeleton";

type AnalyzerState =
  | { status: "idle" }
  | { status: "analyzing" }
  | { status: "success"; analysis: CompetitorAdAnalysis }
  | { status: "error"; message: string };

export default function CompetitorAnalyzerPageClient() {
  const { refresh } = useCredits();
  const [state, setState] = useState<AnalyzerState>({ status: "idle" });
  const [betterAd, setBetterAd] = useState<BetterCompetitorAd | null>(null);
  const [isGeneratingBetter, setIsGeneratingBetter] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const handleAnalyze = useCallback(async (file: File) => {
    setState({ status: "analyzing" });
    setBetterAd(null);
    setGenerateError(null);

    try {
      const analysis = await analyzeCompetitorAd(file);
      setState({ status: "success", analysis });
    } catch (error) {
      setState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to analyze competitor ad. Please try again.",
      });
      throw error;
    }
  }, []);

  const handleGenerateBetter = async () => {
    if (state.status !== "success") return;

    setIsGeneratingBetter(true);
    setGenerateError(null);

    try {
      const result = await generateBetterCompetitorAd(state.analysis);
      setBetterAd({
        hooks: result.hooks,
        captions: result.captions,
        ctas: result.ctas,
        ugcScript: result.ugcScript,
      });
      void refresh();
    } catch (error) {
      if (isNoCreditsError(error)) {
        setUpgradeOpen(true);
        return;
      }

      setGenerateError(
        error instanceof Error
          ? error.message
          : "Failed to generate better ad. Please try again."
      );
    } finally {
      setIsGeneratingBetter(false);
    }
  };

  const isAnalyzing = state.status === "analyzing";
  const hasAnalysis = state.status === "success";

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />

      <section className="gradient-border overflow-hidden rounded-2xl bg-[#0a0618] shadow-xl shadow-violet-500/5">
        <div className="border-b border-white/[0.06] px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/30 via-violet-500/30 to-fuchsia-500/20">
              <Target className="h-5 w-5 text-cyan-400" strokeWidth={1.75} />
            </span>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-white sm:text-lg">
                Upload a competitor ad
              </h2>
              <p className="text-sm text-zinc-500">
                Screenshot any Meta, Instagram, Facebook, TikTok, or Google ad
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 p-4 sm:p-6">
          <CompetitorAdUpload
            disabled={isAnalyzing || isGeneratingBetter}
            isAnalyzing={isAnalyzing}
            onAnalyze={handleAnalyze}
          />

          {state.status === "error" && (
            <div
              role="alert"
              className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3"
            >
              <p className="text-sm text-red-400">{state.message}</p>
            </div>
          )}

          <p className="text-xs text-zinc-600">
            Analysis is free — no credits used. &ldquo;Generate Better Ad&rdquo;
            uses 1 credit.
          </p>
        </div>
      </section>

      {isAnalyzing && <CompetitorAnalyzerSkeleton />}

      {hasAnalysis && (
        <>
          <CompetitorAnalysisResults analysis={state.analysis} />

          <section className="glass rounded-2xl border border-white/[0.08] p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Outperform this competitor
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Generate 5 hooks, 3 captions, 3 CTAs, and 1 UGC script
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handleGenerateBetter()}
                disabled={isGeneratingBetter}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isGeneratingBetter ? (
                  <LoadingSpinner className="h-5 w-5" />
                ) : (
                  <Sparkles className="h-4 w-4" aria-hidden />
                )}
                {isGeneratingBetter ? "Generating…" : "Generate Better Ad"}
              </button>
            </div>

            {generateError && (
              <div
                role="alert"
                className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3"
              >
                <p className="text-sm text-red-400">{generateError}</p>
              </div>
            )}
          </section>

          {betterAd && <CompetitorBetterAdOutput data={betterAd} />}
        </>
      )}

      {state.status === "idle" && (
        <section className="glass rounded-2xl border border-dashed border-white/10 p-8 text-center sm:p-12">
          <Target className="mx-auto h-10 w-10 text-zinc-600" strokeWidth={1.5} />
          <h3 className="mt-4 text-lg font-semibold text-white">
            Ready to analyze
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-zinc-500">
            Upload a competitor ad screenshot to get scores, psychology
            insights, improvement suggestions, and AI-generated copy that beats
            it.
          </p>
        </section>
      )}
    </div>
  );
}
