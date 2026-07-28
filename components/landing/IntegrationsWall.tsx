"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Briefcase, Globe2, MessageCircle, Play, Send, Share2, type LucideIcon } from "lucide-react";
import LandingSection from "@/components/landing/LandingSection";

const integrations: Array<[string, LucideIcon, string]> = [
  ["X", MessageCircle, "Real-time conversation"],
  ["LinkedIn", Briefcase, "Professional reach"],
  ["Instagram", Share2, "Visual storytelling"],
  ["Facebook", Share2, "Community growth"],
  ["TikTok", Play, "Short-form momentum"],
  ["Web", Globe2, "Landing page insights"],
  ["Campaigns", Send, "One publishing loop"],
];

export default function IntegrationsWall() {
  return (
    <LandingSection
      id="integrations"
      eyebrow="Connected by design"
      title={<>Your entire growth stack, <span className="gradient-text">in sync</span></>}
      description="Move from idea to distribution without losing the thread."
    >
      <div className="marquee-window relative mt-12 overflow-hidden">
        <motion.div
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
          className="flex w-max gap-4"
        >
          {[...integrations, ...integrations].map(([name, Icon, detail], index) => (
            <div key={`${name}-${index}`} className="premium-card glass group w-48 rounded-2xl border border-white/10 p-5 transition hover:border-cyan-300/30 hover:bg-white/[.08]">
              <div className="flex items-center justify-between">
                <Icon className="h-6 w-6 text-white/75 transition group-hover:text-cyan-300" />
                <ArrowUpRight className="h-4 w-4 text-white/25 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white/70" />
              </div>
              <p className="mt-8 text-sm font-semibold text-white">{name}</p>
              <p className="mt-1 text-xs text-white/40">{detail}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </LandingSection>
  );
}
