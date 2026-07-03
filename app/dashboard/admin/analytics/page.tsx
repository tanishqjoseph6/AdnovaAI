import AdminAnalyticsPageClient from "@/components/admin/AdminAnalyticsPageClient";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { requireAdminPage } from "@/lib/admin/page-auth";

export default async function AdminAnalyticsPage() {
  await requireAdminPage({ ownerOnly: true });

  return (
    <DashboardShell
      title="Admin Analytics"
      subtitle="Users, revenue, MRR, credits, plans, countries, and feedback trends"
    >
      <AdminAnalyticsPageClient />
    </DashboardShell>
  );
}
