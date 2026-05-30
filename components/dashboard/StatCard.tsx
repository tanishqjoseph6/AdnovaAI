type StatCardProps = {
  label: string;
  value: string;
  change: string;
  positive?: boolean;
  icon: React.ReactNode;
  accent: "cyan" | "violet" | "fuchsia" | "emerald";
};

const accentStyles = {
  cyan: "from-cyan-500/20 to-cyan-500/5 text-cyan-400",
  violet: "from-violet-500/20 to-violet-500/5 text-violet-400",
  fuchsia: "from-fuchsia-500/20 to-fuchsia-500/5 text-fuchsia-400",
  emerald: "from-emerald-500/20 to-emerald-500/5 text-emerald-400",
};

export default function StatCard({
  label,
  value,
  change,
  positive = true,
  icon,
  accent,
}: StatCardProps) {
  return (
    <article className="glass group rounded-2xl p-5 transition hover:border-white/12">
      <div className="flex items-start justify-between">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${accentStyles[accent]}`}
        >
          {icon}
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            positive
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-red-500/10 text-red-400"
          }`}
        >
          {change}
        </span>
      </div>
      <p className="mt-4 text-2xl font-bold tracking-tight text-white">
        {value}
      </p>
      <p className="mt-1 text-sm text-zinc-500">{label}</p>
    </article>
  );
}
