"use client";

import { motion } from "framer-motion";
import { TRUSTED_BRANDS } from "@/lib/landing/content";

export default function TrustedBrands() {
  return (
    <section className="relative border-y border-white/[0.06] bg-white/[0.02] py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="mb-8 text-center text-[11px] font-semibold uppercase tracking-[0.25em] text-zinc-500">
          Trusted by modern brands
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {TRUSTED_BRANDS.map((brand, index) => (
            <motion.span
              key={brand}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: index * 0.05 }}
              className="text-sm font-medium tracking-wide text-zinc-500 transition-colors hover:text-zinc-300"
            >
              {brand}
            </motion.span>
          ))}
        </div>
      </div>
    </section>
  );
}
