import AdminAuditLogsPageClient from "@/components/admin/AdminAuditLogsPageClient";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { requireAdminPage } from "@/lib/admin/page-auth";

export default async function AdminAuditLogsPage() {
  await requireAdminPage({ ownerOnly: true });

  return (
    <DashboardShell
      title="Admin Audit Logs"
      subtitle="Trace role changes, suspensions, notifications, and support activity"
    >
      <AdminAuditLogsPageClient />
    </DashboardShell>
  );
}
