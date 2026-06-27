"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

const FAQ_ITEMS = [
  {
    question: "Can I cancel anytime?",
    answer:
      "Yes. You can upgrade, downgrade or cancel your subscription whenever you want.",
  },
  {
    question: "Do you offer refunds?",
    answer: "Refunds are handled according to Advora's refund policy.",
  },
  {
    question: "Which payment methods are supported?",
    answer:
      "INR payments use Razorpay. International payments use Stripe (when enabled).",
  },
  {
    question: "Can I upgrade later?",
    answer:
      "Yes. Your plan can be upgraded anytime without losing your existing account or data.",
  },
  {
    question: "Do unused credits roll over?",
    answer: "No. Monthly credits reset according to your billing cycle.",
  },
] as const;

function FaqItem({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] transition duration-300 hover:border-white/[0.14] hover:bg-white/[0.05] hover:shadow-lg hover:shadow-violet-500/5">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6 sm:py-5"
      >
        <span className="text-sm font-semibold text-white sm:text-base">
          {question}
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 26 }}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-zinc-400"
        >
          <ChevronDown className="h-4 w-4" aria-hidden />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/[0.06] px-5 pb-5 pt-1 sm:px-6 sm:pb-6">
              <p className="text-sm leading-relaxed text-zinc-400">{answer}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function BillingFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="space-y-6"
      aria-labelledby="billing-faq-heading"
    >
      <div className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-400/90">
          FAQ
        </p>
        <h3
          id="billing-faq-heading"
          className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl"
        >
          Billing questions, answered
        </h3>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-zinc-500">
          Everything you need to know about plans, payments, and upgrades.
        </p>
      </div>

      <div className="mx-auto max-w-3xl space-y-3">
        {FAQ_ITEMS.map((item, index) => (
          <FaqItem
            key={item.question}
            question={item.question}
            answer={item.answer}
            isOpen={openIndex === index}
            onToggle={() =>
              setOpenIndex((current) => (current === index ? null : index))
            }
          />
        ))}
      </div>
    </motion.section>
  );
}
