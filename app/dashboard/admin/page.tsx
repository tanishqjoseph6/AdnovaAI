import AdminDashboardPageClient from "@/components/admin/AdminDashboardPageClient";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { requireAdminPage } from "@/lib/admin/page-auth";

export default async function AdminIndexPage() {
  await requireAdminPage();

  return (
    <DashboardShell
      title="Admin Dashboard"
      subtitle="System health, growth, revenue, feedback, and activity"
    >
      <AdminDashboardPageClient />
    </DashboardShell>
  );
}
