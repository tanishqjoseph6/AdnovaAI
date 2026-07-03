import AdminPaymentsPageClient from "@/components/admin/AdminPaymentsPageClient";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { requireAdminPage } from "@/lib/admin/page-auth";

export default async function AdminPaymentsPage() {
  await requireAdminPage();

  return (
    <DashboardShell
      title="Admin Payments"
      subtitle="Payment history, invoices, refunds, and subscription status"
    >
      <AdminPaymentsPageClient />
    </DashboardShell>
  );
}
