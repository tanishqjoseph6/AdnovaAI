"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import LandingSection from "@/components/landing/LandingSection";
import { LANDING_FAQ } from "@/lib/landing/content";

export default function LandingFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <LandingSection
      id="faq"
      eyebrow="FAQ"
      title={
        <>
          Questions, <span className="gradient-text">answered</span>
        </>
      }
      description="Everything you need to know before you start creating with Advora AI."
    >
      <div className="mx-auto max-w-3xl space-y-3">
        {LANDING_FAQ.map((item, index) => {
          const isOpen = openIndex === index;

          return (
            <motion.div
              key={item.question}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="glass overflow-hidden rounded-2xl border border-white/[0.08]"
            >
              <button
                type="button"
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                aria-expanded={isOpen}
              >
                <span className="font-medium text-white">{item.question}</span>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-zinc-500 transition ${isOpen ? "rotate-180" : ""}`}
                />
              </button>
              <AnimatePresence initial={false}>
                {isOpen ? (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <p className="border-t border-white/[0.06] px-5 py-4 text-sm leading-relaxed text-zinc-400">
                      {item.answer}
                    </p>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </LandingSection>
  );
}
