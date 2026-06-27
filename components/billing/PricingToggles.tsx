"use client";

import { motion } from "framer-motion";
import { useBillingPricing } from "@/components/billing/BillingPricingContext";
import { YEARLY_DISCOUNT_PERCENT } from "@/lib/billing/pricing";

function ToggleGroup<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { id: T; label: string; badge?: string }[];
  onChange: (next: T) => void;
}) {
  return (
    <div
      className="flex flex-col items-center gap-2 sm:items-start"
      role="group"
      aria-label={label}
    >
      <span className="sr-only">{label}</span>
      <div className="inline-flex rounded-xl border border-white/10 bg-white/[0.03] p-1">
        {options.map((option) => {
          const active = value === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              className={`relative rounded-lg px-4 py-2 text-sm font-medium transition ${
                active
                  ? "text-white"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
              aria-pressed={active}
            >
              {active && (
                <motion.span
                  layoutId={`billing-toggle-${label.replace(/\s+/g, "-").toLowerCase()}`}
                  className="absolute inset-0 rounded-lg bg-gradient-to-r from-cyan-500/20 via-violet-500/20 to-fuchsia-500/20 ring-1 ring-white/10"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative inline-flex items-center gap-2">
                {option.label}
                {option.badge && (
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
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
    <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
      <ToggleGroup
        label="Billing interval"
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
        value={currency}
        onChange={setCurrency}
        options={[
          { id: "INR", label: "INR (₹)" },
          { id: "USD", label: "USD ($)" },
        ]}
      />
    </div>
  );
}
