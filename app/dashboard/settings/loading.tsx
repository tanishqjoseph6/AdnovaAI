import DashboardShell from "@/components/dashboard/DashboardShell";

export default function SettingsLoading() {
  return (
    <DashboardShell
      title="Settings"
      subtitle="Manage your account, profile and preferences"
    >
      <div className="mx-auto max-w-3xl space-y-6" aria-busy="true">
        <div className="h-20 animate-pulse rounded-2xl bg-white/[0.04]" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-48 animate-pulse rounded-2xl bg-white/[0.04]"
          />
        ))}
      </div>
    </DashboardShell>
  );
}
