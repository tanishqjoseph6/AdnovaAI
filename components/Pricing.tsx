import { PLANS } from "@/lib/billing/plans";

const plans = [
  {
    name: PLANS.free.name,
    priceLabel: PLANS.free.priceLabel,
    description: "For founders trying AI ad creative for the first time.",
    features: [...PLANS.free.features],
    cta: "Start free",
    highlighted: false,
  },
  {
    name: PLANS.starter.name,
    priceLabel: PLANS.starter.priceLabel,
    description: "For founders and small teams testing paid channels.",
    features: [...PLANS.starter.features],
    cta: "Start with Starter",
    highlighted: true,
  },
  {
    name: PLANS.pro.name,
    priceLabel: PLANS.pro.priceLabel,
    description: "For growth teams scaling creative across channels.",
    features: [...PLANS.pro.features],
    cta: "Upgrade to Pro",
    highlighted: false,
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="relative py-24 md:py-32">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/10 blur-[120px]" />

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-fuchsia-400">
            Pricing
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-4xl">
            Simple plans,{" "}
            <span className="gradient-text">serious ROI</span>
          </h2>
          <p className="mt-4 text-lg text-zinc-400">
            Start free with monthly AI credits. Cancel anytime. No hidden fees.
          </p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={`relative flex flex-col rounded-2xl p-8 ${
                plan.highlighted
                  ? "gradient-border bg-[#0a0618] shadow-xl shadow-violet-500/20"
                  : "glass"
              }`}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 px-4 py-1 text-xs font-semibold text-white">
                  Most popular
                </span>
              )}

              <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
              <p className="mt-2 text-sm text-zinc-400">{plan.description}</p>

              <div className="mt-6 flex items-baseline gap-1">
                {plan.priceLabel.includes("/") ? (
                  <>
                    <span className="text-4xl font-bold text-white">
                      {plan.priceLabel.split("/")[0]}
                    </span>
                    <span className="text-zinc-500">/month</span>
                  </>
                ) : (
                  <span className="text-4xl font-bold text-white">
                    {plan.priceLabel}
                  </span>
                )}
              </div>

              <ul className="mt-8 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-3 text-sm text-zinc-300"
                  >
                    <svg
                      className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <a
                href="#cta"
                className={`mt-8 block rounded-full py-3 text-center text-sm font-semibold transition ${
                  plan.highlighted
                    ? "bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25 hover:opacity-90"
                    : "border border-white/15 bg-white/5 text-white hover:bg-white/10"
                }`}
              >
                {plan.cta}
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
