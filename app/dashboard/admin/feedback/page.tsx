import AdminFeedbackPageClient from "@/components/admin/AdminFeedbackPageClient";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { requireAdminPage } from "@/lib/admin/page-auth";

export default async function AdminFeedbackPage() {
  await requireAdminPage();

  return (
    <DashboardShell
      title="Admin Feedback"
      subtitle="Review beta feedback, reply to users, and manage ticket status"
    >
      <AdminFeedbackPageClient />
    </DashboardShell>
  );
}
