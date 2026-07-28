"use client";

import { useState } from "react";
import { Clapperboard } from "lucide-react";
import LoadingSpinner from "@/components/dashboard/LoadingSpinner";
import ReelScriptForm from "@/components/reel-script/ReelScriptForm";
import ReelScriptResults from "@/components/reel-script/ReelScriptResults";
import ReelScriptSkeleton from "@/components/reel-script/ReelScriptSkeleton";
import { generateReelScript } from "@/lib/api/reel-script-client";
import { isNoCreditsError } from "@/lib/api/credits-client";
import { dispatchNoCreditsEvent } from "@/lib/credits/client-events";
import { useCredits } from "@/hooks/useCredits";
import {
  EMPTY_REEL_SCRIPT_INPUT,
  type ReelScriptInput,
  type ReelScriptResult,
} from "@/lib/reel-script/types";

type GeneratorState =
  | { status: "idle" }
  | { status: "loading" }
  | {
      status: "success";
      result: ReelScriptResult;
      scriptId: string | null;
      saved: boolean;
    }
  | { status: "error"; message: string };

export default function ReelScriptPageClient() {
  const { refresh } = useCredits();
  const [form, setForm] = useState<ReelScriptInput>(EMPTY_REEL_SCRIPT_INPUT);
  const [state, setState] = useState<GeneratorState>({ status: "idle" });

  function updateForm<K extends keyof ReelScriptInput>(
    key: K,
    value: ReelScriptInput[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
    if (state.status === "error") {
      setState({ status: "idle" });
    }
  }

  async function handleGenerate() {
    setState({ status: "loading" });

    try {
      const response = await generateReelScript(form);
      void refresh();
      window.dispatchEvent(new CustomEvent("advora:generation-success"));
      setState({
        status: "success",
        result: response.result,
        scriptId: response.scriptId,
        saved: response.saved,
      });
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
            : "Failed to generate reel script. Please try again.",
      });
    }
  }

  const isLoading = state.status === "loading";

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <section className="gradient-border overflow-hidden rounded-2xl bg-[#0a0618] shadow-xl shadow-violet-500/5">
        <div className="border-b border-white/[0.06] px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/30 via-violet-500/30 to-fuchsia-500/20">
              <Clapperboard
                className="h-5 w-5 text-cyan-400"
                strokeWidth={1.75}
              />
            </span>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-white sm:text-lg">
                AI Reel Script Generator
              </h2>
              <p className="text-sm text-zinc-500">
                Create scroll-stopping hooks, scenes, VO, CTAs, captions, and
                hashtags
              </p>
            </div>
            {isLoading ? (
              <span className="ml-auto inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1 text-xs text-violet-200">
                <LoadingSpinner className="h-3.5 w-3.5" />
                Writing your reel…
              </span>
            ) : null}
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <ReelScriptForm
            value={form}
            isLoading={isLoading}
            onChange={updateForm}
            onSubmit={() => void handleGenerate()}
          />

          {state.status === "error" ? (
            <div
              role="alert"
              className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3"
            >
              <p className="text-sm text-red-400">{state.message}</p>
            </div>
          ) : null}
        </div>
      </section>

      {isLoading ? <ReelScriptSkeleton /> : null}

      {state.status === "success" ? (
        <ReelScriptResults
          input={form}
          result={state.result}
          scriptId={state.scriptId}
          saved={state.saved}
          isRegenerating={isLoading}
          onRegenerate={() => void handleGenerate()}
        />
      ) : null}

      {state.status === "idle" && !isLoading ? (
        <section className="glass rounded-2xl border border-dashed border-white/10 p-8 text-center sm:p-12">
          <Clapperboard
            className="mx-auto h-10 w-10 text-zinc-600"
            strokeWidth={1.5}
          />
          <h3 className="mt-4 text-lg font-semibold text-white">
            Ready to write a viral reel
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-zinc-500">
            Fill in your product details and Advora will generate hooks, a
            scene-by-scene script, camera directions, B-roll, voice-over, CTA,
            caption, hashtags, and a thumbnail title.
          </p>
        </section>
      ) : null}
    </div>
  );
}
