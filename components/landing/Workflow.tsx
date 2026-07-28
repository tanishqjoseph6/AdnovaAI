"use client";

import { motion } from "framer-motion";
import { BarChart3, Bot, Megaphone, PencilLine, Search, Send, Sparkles } from "lucide-react";
import LandingSection from "@/components/landing/LandingSection";

const steps = [
  ["Research", Search, "See the market, competitors, and customer language clearly."],
  ["Strategy", Sparkles, "Turn signals into a focused creative direction."],
  ["Content", PencilLine, "Generate hooks, scripts, captions, and concepts."],
  ["Design", Bot, "Shape every idea into on-brand creative."],
  ["Publish", Send, "Move campaigns across your channels with confidence."],
  ["Analyze", BarChart3, "Read what worked without stitching reports together."],
  ["Optimize", Megaphone, "Keep the loop moving and compound your advantage."],
] as const;

export default function Workflow() {
  return (
    <LandingSection
      id="workflow"
      eyebrow="The Advora loop"
      title={<>One connected loop from <span className="gradient-text">signal to scale</span></>}
      description="Advora connects the work that usually lives across tabs, tools, and handoffs."
      className="bg-gradient-to-b from-transparent via-violet-950/15 to-transparent"
    >
      <div className="relative mt-14 grid gap-3 md:grid-cols-7">
        <div className="pointer-events-none absolute left-[7%] right-[7%] top-10 hidden h-px bg-gradient-to-r from-cyan-400/0 via-violet-400/50 to-fuchsia-400/0 md:block" />
        {steps.map(([label, Icon, description], index) => (
          <motion.article
            key={label}
            initial={{ opacity: 0, y: 18, filter: "blur(6px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: .55, delay: index * .07 }}
            className="premium-card glass relative z-10 rounded-2xl border border-white/10 p-4 text-center transition hover:-translate-y-1 hover:border-cyan-300/30"
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[.06] text-cyan-300 shadow-[0_0_28px_rgba(34,211,238,.1)]">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-white">{label}</h3>
            <p className="mt-2 text-xs leading-relaxed text-white/45">{description}</p>
          </motion.article>
        ))}
      </div>
    </LandingSection>
  );
}
