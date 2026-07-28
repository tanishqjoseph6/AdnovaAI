"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import LandingSection from "@/components/landing/LandingSection";

const DEMO_STEPS = [
  {
    title: "Analyzing competitor angles",
    detail: "Scanning hooks, offers, and positioning in your category.",
    output: "Top 3 angles identified · urgency · social proof · outcome-led",
  },
  {
    title: "Generating campaign strategy",
    detail: "Building audience, channel mix, and messaging direction.",
    output: "Meta + LinkedIn · D2C founders · conversion-first messaging",
  },
  {
    title: "Writing ad copy & hooks",
    detail: "Creating platform-ready captions, CTAs, and UGC scripts.",
    output: "12 hooks · 6 captions · 3 UGC scripts · 4 CTAs",
  },
  {
    title: "Designing creative concepts",
    detail: "Applying brand kit colors, tone, and visual direction.",
    output: "Brand-aligned thumbnails + ad visual briefs ready",
  },
  {
    title: "Scheduling publish queue",
    detail: "Queueing posts across connected social channels.",
    output: "8 posts scheduled · 4 platforms · approval workflow ready",
  },
  {
    title: "Campaign ready",
    detail: "Your full campaign is live inside Advora.",
    output: "Review, approve, publish, and optimize from one workspace.",
  },
] as const;

export default function InteractiveDemo() {
  const [activeStep, setActiveStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const stepTimer = window.setInterval(() => {
      setActiveStep((current) => (current + 1) % DEMO_STEPS.length);
      setProgress(0);
    }, 3200);

    const progressTimer = window.setInterval(() => {
      setProgress((current) => Math.min(current + 4, 100));
    }, 120);

    return () => {
      window.clearInterval(stepTimer);
      window.clearInterval(progressTimer);
    };
  }, []);

  const step = DEMO_STEPS[activeStep];
  const complete = progress >= 100;

  return (
    <LandingSection
      id="demo"
      eyebrow="See it in action"
      title={
        <>
          Watch a campaign get built{" "}
          <span className="gradient-text">step by step</span>
        </>
      }
      description="Advora orchestrates research, strategy, creative, and publishing — automatically."
      className="bg-gradient-to-b from-transparent via-cyan-950/10 to-transparent"
    >
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="space-y-2">
          {DEMO_STEPS.map((item, index) => {
            const isActive = index === activeStep;
            const isDone = index < activeStep;
            return (
              <button
                key={item.title}
                type="button"
                onClick={() => {
                  setActiveStep(index);
                  setProgress(0);
                }}
                className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition ${
                  isActive
                    ? "border-cyan-300/30 bg-cyan-400/10"
                    : "border-white/10 bg-white/[0.02] hover:border-white/20"
                }`}
              >
                <span
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold ${
                    isDone
                      ? "border-emerald-400/40 bg-emerald-400/15 text-emerald-200"
                      : isActive
                        ? "border-cyan-300/40 bg-cyan-300/15 text-cyan-100"
                        : "border-white/15 text-white/35"
                  }`}
                >
                  {isDone ? <Check className="h-3.5 w-3.5" /> : index + 1}
                </span>
                <span>
                  <span className="block text-sm font-medium text-white">
                    {item.title}
                  </span>
                  {isActive ? (
                    <span className="mt-1 block text-xs text-white/45">
                      {item.detail}
                    </span>
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>

        <motion.div
          layout
          className="premium-card glass overflow-hidden rounded-2xl border border-white/10"
        >
          <div className="border-b border-white/10 px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-cyan-300" />
                <p className="text-sm font-medium text-white">AI Campaign Builder</p>
              </div>
              <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] uppercase tracking-wider text-white/40">
                Step {activeStep + 1} of {DEMO_STEPS.length}
              </span>
            </div>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.12, ease: "linear" }}
              />
            </div>
          </div>

          <div className="p-5 sm:p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35 }}
              >
                <p className="text-lg font-semibold text-white">{step.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-white/50">
                  {step.detail}
                </p>
                <div className="mt-6 rounded-xl border border-white/10 bg-black/25 p-4 font-mono text-xs leading-relaxed text-cyan-100/80">
                  {complete ? (
                    <span className="inline-flex items-center gap-2 text-emerald-300">
                      <Check className="h-3.5 w-3.5" /> {step.output}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-300" />
                      Generating…
                    </span>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </LandingSection>
  );
}
