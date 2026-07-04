"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { FREE_PLAN_CREDITS } from "@/lib/credits/constants";

export default function CTA() {
  return (
    <section id="cta" className="relative py-20 md:py-28">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-cyan-950/20 via-violet-950/30 to-fuchsia-950/20" />
      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="gradient-border overflow-hidden rounded-3xl"
        >
          <div className="glass px-6 py-14 sm:px-12 sm:py-16">
            <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl lg:text-5xl">
              Ready to create ads that{" "}
              <span className="gradient-text">actually convert</span>?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-zinc-400 sm:text-lg">
              Join growth teams using Advora to generate, analyze, and schedule
              creative — starting with {FREE_PLAN_CREDITS} free credits.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/signup"
                className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 px-8 py-4 text-base font-semibold text-white shadow-xl shadow-violet-500/25 transition hover:opacity-90 sm:w-auto"
              >
                Create your free account
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] px-8 py-4 text-base font-medium text-zinc-200 transition hover:bg-white/[0.08] sm:w-auto"
              >
                Log in
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
