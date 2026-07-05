import type { ReactNode } from "react";

type SettingsSectionCardProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
};

export default function SettingsSectionCard({
  title,
  description,
  icon,
  children,
}: SettingsSectionCardProps) {
  return (
    <section className="glass group rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 shadow-xl shadow-black/10 backdrop-blur-xl transition duration-300 hover:border-violet-500/20 hover:shadow-violet-500/10 sm:p-7">
      <div className="flex items-start gap-3">
        {icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-500/10 text-violet-400">
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold tracking-tight text-white">
            {title}
          </h3>
          {description && (
            <p className="mt-1 text-sm text-zinc-500">{description}</p>
          )}
        </div>
      </div>
      <div className={icon ? "mt-6" : "mt-5"}>{children}</div>
    </section>
  );
}
