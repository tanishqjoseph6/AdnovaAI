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
    <section id={id} className={`relative py-24 md:py-32 ${className}`}>
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-3xl text-center"
        >
          {eyebrow ? (
            <p className="section-eyebrow">{eyebrow}</p>
          ) : null}
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-white md:text-5xl md:leading-[1.08]">
            {title}
          </h2>
          {description ? (
            <p className="mt-5 text-base leading-relaxed text-zinc-400 sm:text-lg md:text-xl">
              {description}
            </p>
          ) : null}
        </motion.div>
        <div className="mt-16 md:mt-20">{children}</div>
      </div>
    </section>
  );
}
