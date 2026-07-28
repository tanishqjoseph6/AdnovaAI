"use client";

import { motion } from "framer-motion";
import {
  BarChart3,
  Megaphone,
  Palette,
  PencilLine,
  Search,
  Send,
  Sparkles,
} from "lucide-react";
import LandingSection from "@/components/landing/LandingSection";

const steps = [
  ["Research", Search, "See the market, competitors, and customer language clearly."],
  ["Strategy", Sparkles, "Turn signals into a focused creative direction."],
  ["Content", PencilLine, "Generate hooks, scripts, captions, and concepts."],
  ["Creative", Palette, "Shape every idea into on-brand visual and ad creative."],
  ["Publish", Send, "Move campaigns across your channels with confidence."],
  ["Analytics", BarChart3, "Read what worked without stitching reports together."],
  ["Optimize", Megaphone, "Keep the loop moving and compound your advantage."],
] as const;

export default function Workflow() {
  return (
    <LandingSection
      id="workflow"
      eyebrow="The Advora loop"
      title={
        <>
          One connected loop from{" "}
          <span className="gradient-text">signal to scale</span>
        </>
      }
      description="Advora connects the work that usually lives across tabs, tools, and handoffs."
      className="bg-gradient-to-b from-transparent via-violet-950/15 to-transparent"
    >
      <div className="relative">
        <div className="pointer-events-none absolute left-[4%] right-[4%] top-12 hidden h-px bg-gradient-to-r from-cyan-400/0 via-violet-400/50 to-fuchsia-400/0 lg:block" />

        <div className="flex gap-3 overflow-x-auto pb-2 lg:grid lg:grid-cols-7 lg:overflow-visible lg:pb-0">
          {steps.map(([label, Icon, description], index) => (
            <motion.article
              key={label}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: index * 0.07 }}
              whileHover={{ y: -4 }}
              className="premium-card glass relative z-10 min-w-[140px] shrink-0 rounded-2xl border border-white/10 p-4 text-center transition hover:border-cyan-300/30 lg:min-w-0"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-cyan-300 shadow-[0_0_28px_rgba(34,211,238,0.1)]">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-white">{label}</h3>
              <p className="mt-2 hidden text-xs leading-relaxed text-white/45 lg:block">
                {description}
              </p>
              {index < steps.length - 1 ? (
                <span className="absolute -right-2 top-1/2 hidden -translate-y-1/2 text-white/20 lg:inline">
                  ↓
                </span>
              ) : null}
            </motion.article>
          ))}
        </div>
      </div>
    </LandingSection>
  );
}
