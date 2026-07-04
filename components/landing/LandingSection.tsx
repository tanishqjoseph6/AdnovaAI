"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

type LandingSectionProps = {
  id?: string;
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  children: ReactNode;
  className?: string;
};

export default function LandingSection({
  id,
  eyebrow,
  title,
  description,
  children,
  className = "",
}: LandingSectionProps) {
  return (
    <section id={id} className={`relative py-20 md:py-28 ${className}`}>
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.45 }}
          className="mx-auto max-w-2xl text-center"
        >
          {eyebrow ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-400">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-4xl lg:text-[2.75rem] lg:leading-tight">
            {title}
          </h2>
          {description ? (
            <p className="mt-4 text-base leading-relaxed text-zinc-400 sm:text-lg">
              {description}
            </p>
          ) : null}
        </motion.div>
        <div className="mt-14">{children}</div>
      </div>
    </section>
  );
}
