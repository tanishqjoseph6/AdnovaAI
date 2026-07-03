import AdminNotificationsPageClient from "@/components/admin/AdminNotificationsPageClient";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { requireAdminPage } from "@/lib/admin/page-auth";

export default async function AdminNotificationsPage() {
  await requireAdminPage();

  return (
    <DashboardShell
      title="Admin Notifications"
      subtitle="Review and send in-app notifications"
    >
      <AdminNotificationsPageClient />
    </DashboardShell>
  );
}
