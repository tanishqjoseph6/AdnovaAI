import AdminUsersPageClient from "@/components/admin/AdminUsersPageClient";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { requireAdminPage } from "@/lib/admin/page-auth";

export default async function AdminUsersPage() {
  await requireAdminPage();

  return (
    <DashboardShell
      title="Admin Users"
      subtitle="Search users, review plans, inspect credits, and manage roles"
    >
      <AdminUsersPageClient />
    </DashboardShell>
  );
}
