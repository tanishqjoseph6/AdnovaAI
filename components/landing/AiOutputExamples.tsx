"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import LandingSection from "@/components/landing/LandingSection";
import { defaultCtaSuggestions, mockAiOutput } from "@/lib/ai-output-mock";

export default function AiOutputExamples() {
  return (
    <LandingSection
      id="ai-output"
      eyebrow="Output"
      title={
        <>
          Real AI output, <span className="gradient-text">ready to ship</span>
        </>
      }
      description="Every generation delivers hooks, captions, CTA suggestions, and a timestamped UGC script you can edit, score, and save."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="glass rounded-2xl border border-white/[0.08] p-6"
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider text-cyan-400">
            Hooks · 5 generated
          </p>
          <ul className="mt-4 space-y-3">
            {mockAiOutput.hooks.map((hook, i) => (
              <li
                key={hook}
                className="flex gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-zinc-300"
              >
                <span className="text-xs font-semibold text-violet-400">{i + 1}</span>
                {hook}
              </li>
            ))}
          </ul>
        </motion.div>

        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="glass rounded-2xl border border-white/[0.08] p-6"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-fuchsia-400">
              Captions · 3 generated
            </p>
            <ul className="mt-4 space-y-3">
              {mockAiOutput.captions.map((caption) => (
                <li
                  key={caption.slice(0, 40)}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm leading-relaxed text-zinc-400"
                >
                  {caption}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="glass rounded-2xl border border-white/[0.08] p-6"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
              CTA suggestions
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {defaultCtaSuggestions.map((cta) => (
                <span
                  key={cta}
                  className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  {cta}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="glass mt-6 rounded-2xl border border-white/[0.08] p-6"
      >
        <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-400">
          UGC script · timestamped
        </p>
        <pre className="mt-4 overflow-x-auto whitespace-pre-wrap font-sans text-sm leading-relaxed text-zinc-400">
          {mockAiOutput.ugcScript}
        </pre>
      </motion.div>
    </LandingSection>
  );
}
