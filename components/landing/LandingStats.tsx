"use client";

import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const STATS = [
  { value: 10, suffix: "x", label: "Faster Campaigns" },
  { value: 50, suffix: "+", label: "AI Marketing Tools" },
  { value: 1, suffix: "", label: "Workspace" },
  { value: 100, suffix: "%", label: "AI Powered" },
] as const;

function AnimatedStat({
  value,
  suffix,
  label,
  index,
}: {
  value: number;
  suffix: string;
  label: string;
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 900;
    const start = performance.now();
    let frame = 0;

    function tick(now: number) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(value * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, value]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className="premium-card glass rounded-2xl border border-white/10 px-5 py-6 text-center transition hover:-translate-y-0.5 hover:border-cyan-300/25"
    >
      <p className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
        {display}
        {suffix}
      </p>
      <p className="mt-2 text-xs font-medium uppercase tracking-[0.18em] text-white/45">
        {label}
      </p>
    </motion.div>
  );
}

export default function LandingStats() {
  return (
    <section className="relative border-y border-white/[0.06] bg-white/[0.02] py-14 md:py-16">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-3 px-4 sm:px-6 lg:grid-cols-4 lg:gap-4">
        {STATS.map((stat, index) => (
          <AnimatedStat key={stat.label} {...stat} index={index} />
        ))}
      </div>
    </section>
  );
}
