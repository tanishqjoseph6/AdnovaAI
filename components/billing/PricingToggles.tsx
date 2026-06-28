"use client";

import { motion } from "framer-motion";
import { useBillingPricing } from "@/components/billing/BillingPricingContext";
import { YEARLY_DISCOUNT_PERCENT } from "@/lib/billing/pricing";

function ToggleGroup<T extends string>({
  label,
  layoutId,
  value,
  options,
  onChange,
}: {
  label: string;
  layoutId: string;
  value: T;
  options: { id: T; label: string; badge?: string }[];
  onChange: (next: T) => void;
}) {
  return (
    <div
      className="flex flex-col items-center gap-2"
      role="group"
      aria-label={label}
    >
      <span className="sr-only">{label}</span>
      <div className="inline-flex max-w-full flex-wrap justify-center gap-1 rounded-2xl border border-white/10 bg-white/[0.04] p-1 shadow-inner shadow-black/20">
        {options.map((option) => {
          const active = value === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              className={`relative rounded-xl px-3 py-2 text-xs font-medium transition-colors duration-200 sm:px-5 sm:text-sm ${
                active ? "text-white" : "text-zinc-400 hover:text-zinc-200"
              }`}
              aria-pressed={active}
            >
              {active && (
                <motion.span
                  layoutId={layoutId}
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/25 via-violet-500/25 to-fuchsia-500/25 shadow-sm shadow-violet-500/20 ring-1 ring-white/15"
                  transition={{ type: "spring", stiffness: 420, damping: 32 }}
                />
              )}
              <span className="relative inline-flex items-center gap-2">
                {option.label}
                {option.badge && (
                  <span className="rounded-full border border-emerald-500/35 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
                    {option.badge}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function PricingToggles() {
  const { interval, currency, setInterval, setCurrency } = useBillingPricing();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex w-full max-w-full flex-col items-center justify-center gap-4 px-2 sm:flex-row sm:gap-8"
    >
      <ToggleGroup
        label="Billing interval"
        layoutId="billing-interval-toggle"
        value={interval}
        onChange={setInterval}
        options={[
          { id: "monthly", label: "Monthly" },
          {
            id: "yearly",
            label: "Yearly",
            badge: `Save ${YEARLY_DISCOUNT_PERCENT}%`,
          },
        ]}
      />

      <ToggleGroup
        label="Currency"
        layoutId="billing-currency-toggle"
        value={currency}
        onChange={setCurrency}
        options={[
          { id: "INR", label: "🇮🇳 INR" },
          { id: "USD", label: "🇺🇸 USD" },
        ]}
      />
    </motion.div>
  );
}
