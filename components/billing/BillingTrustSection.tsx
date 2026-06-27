"use client";

import { motion } from "framer-motion";

const TRUST_ITEMS = [
  { icon: "🔒", label: "Secure Payments" },
  { icon: "💳", label: "Razorpay Secure Checkout" },
  { icon: "🌍", label: "Global Pricing" },
  { icon: "🔄", label: "Cancel Anytime" },
  { icon: "⚡", label: "Instant Upgrade" },
  { icon: "🛡", label: "Enterprise-grade Security" },
] as const;

export default function BillingTrustSection() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.15 }}
      className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 shadow-lg shadow-black/20 sm:p-6"
      aria-label="Billing trust and security"
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 lg:gap-4">
        {TRUST_ITEMS.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.08 * index }}
            className="group flex flex-col items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-4 text-center transition duration-300 hover:border-white/15 hover:bg-white/[0.05] hover:shadow-md hover:shadow-violet-500/10"
          >
            <span className="text-xl transition-transform duration-300 group-hover:scale-110">
              {item.icon}
            </span>
            <span className="text-xs font-medium leading-snug text-zinc-400 transition-colors group-hover:text-zinc-200 sm:text-sm">
              {item.label}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
