"use client";

import { motion } from "framer-motion";
import { Check, Minus } from "lucide-react";
import LandingSection from "@/components/landing/LandingSection";

type CellValue = boolean | "partial" | false;

const TOOLS = ["ChatGPT", "Canva", "Buffer", "Jasper", "Advora"] as const;

const FEATURES: Array<{
  label: string;
  values: Record<(typeof TOOLS)[number], CellValue>;
}> = [
  {
    label: "All-in-one marketing workspace",
    values: {
      ChatGPT: false,
      Canva: false,
      Buffer: false,
      Jasper: false,
      Advora: true,
    },
  },
  {
    label: "Competitor ad research",
    values: {
      ChatGPT: "partial",
      Canva: false,
      Buffer: false,
      Jasper: "partial",
      Advora: true,
    },
  },
  {
    label: "Campaign scheduling & publishing",
    values: {
      ChatGPT: false,
      Canva: false,
      Buffer: true,
      Jasper: false,
      Advora: true,
    },
  },
  {
    label: "Brand kit & on-brand creative",
    values: {
      ChatGPT: false,
      Canva: "partial",
      Buffer: false,
      Jasper: "partial",
      Advora: true,
    },
  },
  {
    label: "Hooks, captions & UGC scripts",
    values: {
      ChatGPT: "partial",
      Canva: false,
      Buffer: false,
      Jasper: true,
      Advora: true,
    },
  },
  {
    label: "Landing page & ad analysis",
    values: {
      ChatGPT: "partial",
      Canva: false,
      Buffer: false,
      Jasper: false,
      Advora: true,
    },
  },
  {
    label: "Team approval workflow",
    values: {
      ChatGPT: false,
      Canva: false,
      Buffer: false,
      Jasper: false,
      Advora: true,
    },
  },
  {
    label: "Analytics → optimize loop",
    values: {
      ChatGPT: false,
      Canva: false,
      Buffer: "partial",
      Jasper: false,
      Advora: true,
    },
  },
];

function CellIcon({ value, highlight }: { value: CellValue; highlight?: boolean }) {
  if (value === true) {
    return (
      <motion.span
        initial={{ scale: 0.6, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ type: "spring", stiffness: 420, damping: 22 }}
        className={`inline-flex h-7 w-7 items-center justify-center rounded-full ${
          highlight
            ? "bg-emerald-400/20 text-emerald-300 ring-1 ring-emerald-400/30"
            : "bg-white/5 text-emerald-400/80"
        }`}
      >
        <Check className="h-4 w-4" strokeWidth={2.5} />
      </motion.span>
    );
  }

  if (value === "partial") {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-400/10 text-[10px] font-semibold text-amber-300">
        ~
      </span>
    );
  }

  return (
    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.03] text-white/25">
      <Minus className="h-3.5 w-3.5" />
    </span>
  );
}

export default function WhyAdvora() {
  return (
    <LandingSection
      id="why-advora"
      eyebrow="Why Advora?"
      title={
        <>
          One platform instead of{" "}
          <span className="gradient-text">five disconnected tools</span>
        </>
      }
      description="ChatGPT, Canva, Buffer, and Jasper each solve one piece. Advora connects the entire marketing workflow."
      className="bg-gradient-to-b from-transparent via-violet-950/12 to-transparent"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="overflow-x-auto"
      >
        <div className="min-w-[720px] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
          <div className="grid grid-cols-6 border-b border-white/10 bg-white/[0.03] text-center text-xs font-semibold uppercase tracking-wider sm:text-sm">
            <div className="px-4 py-4 text-left text-white/40">Capability</div>
            {TOOLS.map((tool) => (
              <div
                key={tool}
                className={`border-l border-white/10 px-3 py-4 ${
                  tool === "Advora"
                    ? "bg-gradient-to-b from-violet-500/15 to-cyan-500/10 text-white"
                    : "text-white/55"
                }`}
              >
                {tool}
              </div>
            ))}
          </div>

          {FEATURES.map((row, rowIndex) => (
            <motion.div
              key={row.label}
              initial={{ opacity: 0, x: -8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: rowIndex * 0.04 }}
              className={`group grid grid-cols-6 border-b border-white/[0.06] text-sm last:border-b-0 transition hover:bg-white/[0.02] ${
                rowIndex % 2 === 0 ? "" : "bg-white/[0.01]"
              }`}
            >
              <div className="flex items-center px-4 py-4 font-medium text-white/70">
                {row.label}
              </div>
              {TOOLS.map((tool) => (
                <div
                  key={tool}
                  className={`flex items-center justify-center border-l border-white/[0.06] px-3 py-4 transition ${
                    tool === "Advora"
                      ? "bg-violet-500/[0.05] group-hover:bg-violet-500/10"
                      : ""
                  }`}
                >
                  <CellIcon
                    value={row.values[tool]}
                    highlight={tool === "Advora" && row.values[tool] === true}
                  />
                </div>
              ))}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </LandingSection>
  );
}
