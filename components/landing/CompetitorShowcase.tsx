"use client";

import { motion } from "framer-motion";
import { FileDown, Rocket, Target, TrendingUp } from "lucide-react";
import LandingSection from "@/components/landing/LandingSection";

const SCORES = [
  { label: "Hook strength", value: 84 },
  { label: "Visual clarity", value: 78 },
  { label: "CTA effectiveness", value: 71 },
  { label: "Overall score", value: 82 },
];

const INSIGHTS = [
  "Lead with a stronger product benefit in the first 2 seconds",
  "Add social proof near the CTA for trust",
  "Test a shorter headline variant for mobile feeds",
];

export default function CompetitorShowcase() {
  return (
    <LandingSection
      id="competitor"
      eyebrow="Competitor Analyzer"
      title={
        <>
          Reverse-engineer winning ads{" "}
          <span className="gradient-text">with AI vision</span>
        </>
      }
      description="Upload any competitor ad screenshot. Advora breaks down scores, insights, and generates a better-performing version — exportable as PDF."
      className="bg-gradient-to-b from-transparent via-violet-950/10 to-transparent"
    >
      <div className="grid items-center gap-8 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="glass rounded-2xl border border-white/[0.08] p-6"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/20">
              <Target className="h-6 w-6 text-violet-300" />
            </div>
            <div>
              <p className="font-semibold text-white">Competitor Ad Analysis</p>
              <p className="text-sm text-zinc-500">Screenshot → full breakdown</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            {SCORES.map((score) => (
              <div
                key={score.label}
                className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4"
              >
                <p className="text-[10px] uppercase tracking-wider text-zinc-500">
                  {score.label}
                </p>
                <p className="mt-1 text-2xl font-semibold text-white">{score.value}</p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-500"
                    style={{ width: `${score.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <ul className="mt-6 space-y-2">
            {INSIGHTS.map((insight) => (
              <li
                key={insight}
                className="flex gap-2 text-sm text-zinc-400"
              >
                <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
                {insight}
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="space-y-4"
        >
          {[
            {
              icon: Target,
              title: "AI vision breakdown",
              text: "Extract headlines, CTAs, offers, and visual hierarchy from any ad image.",
            },
            {
              icon: Rocket,
              title: "Generate a better ad",
              text: "One click to produce improved hooks, captions, and scripts based on the analysis.",
            },
            {
              icon: FileDown,
              title: "PDF report export",
              text: "Download a shareable competitor analysis report for your team or clients.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="glass flex gap-4 rounded-2xl border border-white/[0.08] p-5"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/15">
                <item.icon className="h-5 w-5 text-cyan-300" />
              </div>
              <div>
                <p className="font-semibold text-white">{item.title}</p>
                <p className="mt-1 text-sm text-zinc-400">{item.text}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </LandingSection>
  );
}
