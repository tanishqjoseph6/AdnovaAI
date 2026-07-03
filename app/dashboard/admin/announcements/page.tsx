import AdminAnnouncementsPageClient from "@/components/admin/AdminAnnouncementsPageClient";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { requireAdminPage } from "@/lib/admin/page-auth";

export default async function AdminAnnouncementsPage() {
  await requireAdminPage({ ownerOnly: true });

  return (
    <DashboardShell
      title="Admin Announcements"
      subtitle="Send product, maintenance, and beta updates to all users"
    >
      <AdminAnnouncementsPageClient />
    </DashboardShell>
  );
}
