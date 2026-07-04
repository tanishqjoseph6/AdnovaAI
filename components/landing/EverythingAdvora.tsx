"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  BarChart3,
  CalendarClock,
  CreditCard,
  History,
  ImageIcon,
  LayoutDashboard,
  Megaphone,
  Palette,
  PenLine,
  ScanSearch,
  Share2,
  Sparkles,
  Target,
  Users,
  Wand2,
} from "lucide-react";
import LandingSection from "@/components/landing/LandingSection";
import { LANDING_FEATURES } from "@/lib/landing/content";
import type { LandingFeature } from "@/lib/landing/content";

const FEATURE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  generate: Megaphone,
  "product-image": ImageIcon,
  "ad-score": BarChart3,
  editor: PenLine,
  "brand-kit": Palette,
  competitor: Target,
  landing: ScanSearch,
  scheduler: CalendarClock,
  history: History,
  referrals: Share2,
  billing: CreditCard,
  dashboard: LayoutDashboard,
};

function FeatureCard({ feature, index }: { feature: LandingFeature; index: number }) {
  const Icon = FEATURE_ICONS[feature.id] ?? Sparkles;

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay: (index % 6) * 0.05 }}
      className="glass group flex h-full flex-col rounded-2xl border border-white/[0.08] p-6 transition hover:border-violet-500/30 hover:shadow-lg hover:shadow-violet-500/10"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 via-violet-500/20 to-fuchsia-500/20 text-cyan-300 transition group-hover:scale-105">
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <h3 className="mt-5 text-lg font-semibold text-white">{feature.title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-400">
        {feature.description}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {feature.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-400"
          >
            {tag}
          </span>
        ))}
      </div>
    </motion.article>
  );
}

export default function EverythingAdvora() {
  return (
    <LandingSection
      id="features"
      eyebrow="Platform"
      title={
        <>
          Everything Advora <span className="gradient-text">can do</span>
        </>
      }
      description="Every tool below is live in your dashboard today — no waitlist, no vaporware."
    >
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {LANDING_FEATURES.map((feature, index) => (
          <FeatureCard key={feature.id} feature={feature} index={index} />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="mt-10 flex flex-wrap items-center justify-center gap-4 text-sm text-zinc-500"
      >
        <span className="inline-flex items-center gap-2">
          <Wand2 className="h-4 w-4 text-violet-400" />
          AI rewrite & scoring included
        </span>
        <span className="hidden h-4 w-px bg-white/10 sm:block" />
        <span className="inline-flex items-center gap-2">
          <Users className="h-4 w-4 text-cyan-400" />
          Referrals & team-ready billing
        </span>
        <Link
          href="/signup"
          className="rounded-full border border-white/10 px-4 py-1.5 text-zinc-300 transition hover:border-white/20 hover:text-white"
        >
          Unlock all features →
        </Link>
      </motion.div>
    </LandingSection>
  );
}
