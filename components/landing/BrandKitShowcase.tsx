"use client";

import { motion } from "framer-motion";
import { Palette, Sparkles, Wand2 } from "lucide-react";
import LandingSection from "@/components/landing/LandingSection";
import {
  BRAND_VOICES,
  CTA_STYLES,
  WRITING_STYLES,
} from "@/lib/brand-kit/types";

export default function BrandKitShowcase() {
  return (
    <LandingSection
      id="brand-kit"
      eyebrow="Brand Kit"
      title={
        <>
          One brand identity,{" "}
          <span className="gradient-text">every generation</span>
        </>
      }
      description="Save your voice, style, and CTA preferences once. Autofill from your website URL and let every ad sound unmistakably on-brand."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass rounded-2xl border border-white/[0.08] p-6"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-fuchsia-500/20">
              <Palette className="h-6 w-6 text-fuchsia-300" />
            </div>
            <div>
              <p className="font-semibold text-white">Your Brand Kit</p>
              <p className="text-sm text-zinc-500">Applied to every AI prompt</p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Brand voice
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {BRAND_VOICES.slice(0, 6).map((voice) => (
                  <span
                    key={voice}
                    className={`rounded-full px-3 py-1 text-xs ${
                      voice === "Premium Tech"
                        ? "bg-violet-500/20 text-violet-200 ring-1 ring-violet-500/40"
                        : "border border-white/10 text-zinc-400"
                    }`}
                  >
                    {voice}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Writing style
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {WRITING_STYLES.map((style) => (
                  <span
                    key={style}
                    className={`rounded-full px-3 py-1 text-xs ${
                      style === "Sales"
                        ? "bg-cyan-500/20 text-cyan-200 ring-1 ring-cyan-500/40"
                        : "border border-white/10 text-zinc-400"
                    }`}
                  >
                    {style}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                CTA style
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {CTA_STYLES.map((style) => (
                  <span
                    key={style}
                    className={`rounded-full px-3 py-1 text-xs ${
                      style === "Direct"
                        ? "bg-fuchsia-500/20 text-fuchsia-200 ring-1 ring-fuchsia-500/40"
                        : "border border-white/10 text-zinc-400"
                    }`}
                  >
                    {style}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="flex flex-col justify-center space-y-4"
        >
          {[
            {
              icon: Wand2,
              title: "URL autofill",
              text: "Paste your website and Advora extracts brand name, audience, USP, and tone automatically.",
            },
            {
              icon: Sparkles,
              title: "Consistent output",
              text: "Brand Kit settings are woven into every generation, analyzer, and rewrite request.",
            },
            {
              icon: Palette,
              title: "Fine-tune everything",
              text: "Caption length, emoji usage, industry, target audience, and custom instructions.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="glass flex gap-4 rounded-2xl border border-white/[0.08] p-5"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/15">
                <item.icon className="h-5 w-5 text-violet-300" />
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
