"use client";

import { motion } from "framer-motion";
import { Building2, Rocket, Sparkles, Users, Video } from "lucide-react";
import LandingSection from "@/components/landing/LandingSection";
import type { LucideIcon } from "lucide-react";

const AUDIENCES: Array<{ label: string; description: string; icon: LucideIcon }> = [
  {
    label: "Startups",
    description: "Launch campaigns without hiring a full marketing team.",
    icon: Rocket,
  },
  {
    label: "D2C Brands",
    description: "Ship scroll-stopping creative across every paid channel.",
    icon: Sparkles,
  },
  {
    label: "Agencies",
    description: "Deliver more client work from one premium workspace.",
    icon: Building2,
  },
  {
    label: "Creators",
    description: "Turn ideas into hooks, scripts, and publish-ready posts.",
    icon: Video,
  },
  {
    label: "Founders",
    description: "Move from insight to execution without the busywork.",
    icon: Users,
  },
];

export default function BuiltFor() {
  return (
    <LandingSection
      id="built-for"
      eyebrow="Built for"
      title={
        <>
          Teams that need to move{" "}
          <span className="gradient-text">fast and stay sharp</span>
        </>
      }
      description="Whether you're launching, scaling, or managing clients — Advora adapts to how you work."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {AUDIENCES.map(({ label, description, icon: Icon }, index) => (
          <motion.article
            key={label}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.45, delay: index * 0.06 }}
            whileHover={{ y: -4 }}
            className="premium-card glass group rounded-2xl border border-white/10 p-5 transition hover:border-violet-400/30 hover:shadow-xl hover:shadow-violet-500/10"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-cyan-400/15 to-violet-500/15 text-cyan-200 transition group-hover:scale-105">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-white">{label}</h3>
            <p className="mt-2 text-sm leading-relaxed text-white/45">
              {description}
            </p>
          </motion.article>
        ))}
      </div>
    </LandingSection>
  );
}
