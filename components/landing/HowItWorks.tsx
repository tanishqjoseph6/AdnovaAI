"use client";

import { motion } from "framer-motion";
import { HOW_IT_WORKS_STEPS } from "@/lib/landing/content";
import LandingSection from "@/components/landing/LandingSection";

export default function HowItWorks() {
  return (
    <LandingSection
      id="how-it-works"
      eyebrow="How it works"
      title={
        <>
          Three steps to <span className="gradient-text">launch-ready ads</span>
        </>
      }
      description="From product input to multi-channel creative — in under a minute."
      className="bg-gradient-to-b from-transparent via-cyan-950/10 to-transparent"
    >
      <div className="grid gap-6 md:grid-cols-3">
        {HOW_IT_WORKS_STEPS.map((item, index) => (
          <motion.article
            key={item.step}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="glass group relative rounded-2xl border border-white/[0.08] p-6 transition hover:border-white/[0.14] hover:shadow-lg hover:shadow-violet-500/10 sm:p-7"
          >
            {index < HOW_IT_WORKS_STEPS.length - 1 ? (
              <div className="pointer-events-none absolute top-1/2 -right-3 hidden h-px w-6 bg-gradient-to-r from-violet-500/50 to-transparent md:block" />
            ) : null}
            <span className="text-xs font-semibold tracking-widest text-violet-400/80">
              {item.step}
            </span>
            <h3 className="mt-4 text-lg font-semibold text-white">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              {item.description}
            </p>
          </motion.article>
        ))}
      </div>
    </LandingSection>
  );
}
