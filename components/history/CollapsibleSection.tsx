"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CopyButton from "@/components/dashboard/CopyButton";

type CollapsibleSectionProps = {
  title: string;
  copyText: string;
  copyLabel?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
};

export default function CollapsibleSection({
  title,
  copyText,
  copyLabel = "Copy all",
  defaultOpen = true,
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02]">
      <div className="flex w-full items-center justify-between gap-3 px-4 py-3.5 transition hover:bg-white/[0.03]">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left transition hover:opacity-90"
          aria-expanded={open}
        >
          <motion.svg
            animate={{ rotate: open ? 90 : 0 }}
            transition={{ duration: 0.2 }}
            className="h-4 w-4 shrink-0 text-zinc-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </motion.svg>
          <span className="text-sm font-semibold text-white">{title}</span>
        </button>
        <CopyButton text={copyText} label={copyLabel} />
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="space-y-2 border-t border-white/[0.06] px-4 py-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
