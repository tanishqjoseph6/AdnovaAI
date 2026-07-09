"use client";

import { useState } from "react";
import { Globe, Search } from "lucide-react";
import { analyzeLandingPage } from "@/lib/api/analyze-landing-client";
import { isNoCreditsError } from "@/lib/api/credits-client";
import { dispatchNoCreditsEvent } from "@/lib/credits/client-events";
import { useCredits } from "@/hooks/useCredits";
import type { LandingPageAnalysis } from "@/lib/landing-analyzer/types";
import LandingAnalyzerResults from "./LandingAnalyzerResults";
import LandingAnalyzerSkeleton from "./LandingAnalyzerSkeleton";
import LoadingSpinner from "@/components/dashboard/LoadingSpinner";

type AnalyzerState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; analysis: LandingPageAnalysis }
  | { status: "error"; message: string };

export default function LandingAnalyzerPageClient() {
  const { refresh } = useCredits();
  const [url, setUrl] = useState("");
  const [state, setState] = useState<AnalyzerState>({ status: "idle" });

  const handleAnalyze = async () => {
    const trimmed = url.trim();
    if (!trimmed) {
      setState({
        status: "error",
        message: "Please enter a website URL.",
      });
      return;
    }

    setState({ status: "loading" });

    try {
      const analysis = await analyzeLandingPage(trimmed);
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
            : "Failed to analyze landing page. Please try again.",
      });
    }
  };

  const isLoading = state.status === "loading";

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <section className="gradient-border overflow-hidden rounded-2xl bg-[#0a0618] shadow-xl shadow-violet-500/5">
        <div className="border-b border-white/[0.06] px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/30 via-violet-500/30 to-fuchsia-500/20">
              <Globe className="h-5 w-5 text-cyan-400" strokeWidth={1.75} />
            </span>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-white sm:text-lg">
                Analyze a landing page
              </h2>
              <p className="text-sm text-zinc-500">
                Paste any public URL to get scores, insights, and ad strategy
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 p-4 sm:p-6">
          <label htmlFor="landing-url" className="sr-only">
            Website URL
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                id="landing-url"
                type="url"
                inputMode="url"
                value={url}
                disabled={isLoading}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (state.status === "error") {
                    setState({ status: "idle" });
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void handleAnalyze();
                  }
                }}
                placeholder="https://example.com"
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-3.5 pl-11 pr-4 text-sm text-white placeholder:text-zinc-600 outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/10 disabled:opacity-50"
              />
            </div>
            <button
              type="button"
              onClick={() => void handleAnalyze()}
              disabled={isLoading || !url.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isLoading ? (
                <LoadingSpinner className="h-5 w-5" />
              ) : (
                <Search className="h-4 w-4" aria-hidden />
              )}
              {isLoading ? "Analyzing..." : "Analyze"}
            </button>
          </div>

          {state.status === "error" && (
            <div
              role="alert"
              className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3"
            >
              <p className="text-sm text-red-400">{state.message}</p>
            </div>
          )}

          <p className="text-xs text-zinc-600">
            Analyzes public HTML pages only. No credits are used for this feature.
          </p>
        </div>
      </section>

      {isLoading && <LandingAnalyzerSkeleton />}

      {state.status === "success" && (
        <LandingAnalyzerResults analysis={state.analysis} />
      )}

      {state.status === "idle" && (
        <section className="glass rounded-2xl border border-dashed border-white/10 p-8 text-center sm:p-12">
          <Globe className="mx-auto h-10 w-10 text-zinc-600" strokeWidth={1.5} />
          <h3 className="mt-4 text-lg font-semibold text-white">
            Ready to analyze
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-zinc-500">
            Enter a landing page URL to uncover conversion scores, marketing
            insights, improvement suggestions, and ready-to-use ad copy.
          </p>
        </section>
      )}
    </div>
  );
}
