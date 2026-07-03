import AdminSettingsPageClient from "@/components/admin/AdminSettingsPageClient";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { requireAdminPage } from "@/lib/admin/page-auth";

export default async function AdminSettingsPage() {
  await requireAdminPage({ ownerOnly: true });

  return (
    <DashboardShell
      title="Admin Settings"
      subtitle="Owner-only system settings and protected configuration"
    >
      <AdminSettingsPageClient />
    </DashboardShell>
  );
}
