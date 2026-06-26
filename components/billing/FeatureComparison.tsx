import {
  BILLING_COMPARISON_FEATURES,
} from "@/lib/billing/comparison";
import { formatBillingPlanLabel } from "@/lib/billing/invoices";
import type { PlanId } from "@/lib/billing/plans";

type FeatureComparisonProps = {
  currentPlanId: PlanId;
};

const COMPARISON_COLUMNS: PlanId[] = ["free", "starter", "pro", "custom"];

function renderValue(value: boolean | string) {
  if (typeof value === "string") {
    return <span className="text-sm font-medium text-zinc-200">{value}</span>;
  }

  if (value) {
    return (
      <svg
        className="mx-auto h-5 w-5 text-emerald-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-label="Included"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 13l4 4L19 7"
        />
      </svg>
    );
  }

  return (
    <span className="text-sm text-zinc-600" aria-label="Not included">
      —
    </span>
  );
}

export default function FeatureComparison({
  currentPlanId,
}: FeatureComparisonProps) {
  return (
    <section className="glass overflow-hidden rounded-2xl border border-white/[0.08]">
      <div className="border-b border-white/[0.06] px-6 py-5 sm:px-8">
        <p className="text-xs font-medium uppercase tracking-widest text-violet-400">
          Compare
        </p>
        <h3 className="mt-1 text-2xl font-bold tracking-tight text-white">
          Feature comparison
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead>
            <tr className="border-b border-white/[0.06] bg-white/[0.02]">
              <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider text-zinc-500 sm:px-8">
                Feature
              </th>
              {COMPARISON_COLUMNS.map((planId) => {
                const isCurrent = currentPlanId === planId;
                return (
                  <th
                    key={planId}
                    className={`px-4 py-4 text-center text-sm font-semibold ${
                      isCurrent ? "text-violet-300" : "text-white"
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span>{formatBillingPlanLabel(planId)}</span>
                      {isCurrent && (
                        <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-violet-300">
                          Current
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {BILLING_COMPARISON_FEATURES.map((feature, rowIndex) => (
              <tr
                key={feature.label}
                className={`border-b border-white/[0.04] transition hover:bg-white/[0.02] ${
                  rowIndex % 2 === 0 ? "" : "bg-white/[0.01]"
                }`}
              >
                <td className="px-6 py-4 text-sm text-zinc-400 sm:px-8">
                  {feature.label}
                </td>
                {COMPARISON_COLUMNS.map((planId) => (
                  <td key={planId} className="px-4 py-4 text-center">
                    {renderValue(feature.values[planId])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
