"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { FileDown, Rocket, Target } from "lucide-react";
import { analyzeCompetitorAd } from "@/lib/api/analyze-competitor-client";
import { isNoCreditsError } from "@/lib/api/credits-client";
import {
  generateBetterCompetitorAd,
  isNoCreditsError as isNoCreditsErrorBetterAd,
} from "@/lib/api/generate-better-competitor-client";
import { dispatchNoCreditsEvent } from "@/lib/credits/client-events";
import { generateCompetitorPdfReport } from "@/lib/competitor-ad/pdf-report";
import type {
  BetterCompetitorAd,
  CompetitorAdAnalysis,
} from "@/lib/competitor-ad/types";
import { useCredits } from "@/hooks/useCredits";
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
  const router = useRouter();
  const { refresh } = useCredits();
  const [state, setState] = useState<AnalyzerState>({ status: "idle" });
  const [betterAd, setBetterAd] = useState<BetterCompetitorAd | null>(null);
  const [isGeneratingBetter, setIsGeneratingBetter] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const handleAnalyze = useCallback(async (file: File) => {
    setState({ status: "analyzing" });
    setBetterAd(null);
    setGenerateError(null);

    try {
      const analysis = await analyzeCompetitorAd(file);
      void refresh();
      setState({ status: "success", analysis });
    } catch (error) {
      if (isNoCreditsError(error)) {
        dispatchNoCreditsEvent();
        setState({ status: "idle" });
        return;
      }

      setState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to analyze competitor ad. Please try again.",
      });
      throw error;
    }
  }, [refresh]);

  const handleGenerateBetter = async () => {
    if (state.status !== "success") return;

    setIsGeneratingBetter(true);
    setGenerateError(null);

    try {
      const result = await generateBetterCompetitorAd(state.analysis);
      setBetterAd(result);
      void refresh();
      if (result.generatedAt) {
        const detail = {
          generatedAt: result.generatedAt,
          remainingCredits: result.credits,
        };
        window.dispatchEvent(
          new CustomEvent("advora:generation-success", { detail })
        );
        router.refresh();
      }
    } catch (error) {
      if (isNoCreditsErrorBetterAd(error)) {
        dispatchNoCreditsEvent();
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

  const handleDownloadPdf = () => {
    if (state.status !== "success") return;
    generateCompetitorPdfReport(state.analysis, betterAd);
  };

  const isAnalyzing = state.status === "analyzing";
  const hasAnalysis = state.status === "success";

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
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
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium text-zinc-200 transition hover:border-cyan-500/30 hover:bg-white/[0.08]"
            >
              <FileDown className="h-4 w-4" aria-hidden />
              Download PDF Report
            </button>
          </div>

          <CompetitorAnalysisResults analysis={state.analysis} />

          <section className="glass relative overflow-hidden rounded-2xl border border-violet-500/30 p-6 sm:p-8">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-600/10 via-transparent to-cyan-500/10" />
            <div className="relative flex flex-col items-center gap-5 text-center">
              <div>
                <h2 className="text-xl font-semibold text-white sm:text-2xl">
                  Outperform this competitor
                </h2>
                <p className="mx-auto mt-2 max-w-lg text-sm text-zinc-400">
                  Generate hooks, headlines, captions, CTAs, offers, UGC script,
                  audience targeting, emotional angles, and visual suggestions —
                  all tailored to beat this ad.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handleGenerateBetter()}
                disabled={isGeneratingBetter}
                className="inline-flex w-full max-w-md items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 px-8 py-4 text-base font-bold text-white shadow-xl shadow-violet-500/30 transition hover:scale-[1.02] hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
              >
                {isGeneratingBetter ? (
                  <LoadingSpinner className="h-6 w-6" />
                ) : (
                  <Rocket className="h-5 w-5" aria-hidden />
                )}
                {isGeneratingBetter ? "Generating…" : "Generate Better Ad"}
              </button>
              <p className="text-xs text-zinc-500">Uses 1 credit</p>
            </div>

            {generateError && (
              <div
                role="alert"
                className="relative mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3"
              >
                <p className="text-sm text-red-400">{generateError}</p>
              </div>
            )}
          </section>

          {betterAd && <CompetitorBetterAdOutput data={betterAd} />}
        </>
      )}

      {state.status === "idle" && (
        <section className="glass relative overflow-hidden rounded-2xl border border-dashed border-white/10 p-8 text-center sm:p-14">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-600/[0.06] via-transparent to-cyan-500/[0.04]" />
          <div className="relative">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
              <Target className="h-8 w-8 text-zinc-500" strokeWidth={1.5} />
            </div>
            <h3 className="mt-5 text-xl font-semibold text-white">
              Ready to analyze
            </h3>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-zinc-500">
              Upload a competitor ad screenshot to unlock score explanations,
              confidence ratings, performance insights, AI comparison, and a
              downloadable agency-ready PDF report.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
