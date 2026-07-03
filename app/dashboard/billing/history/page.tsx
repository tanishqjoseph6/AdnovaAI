import BillingHistoryPageClient from "@/components/billing/BillingHistoryPageClient";
import DashboardShell from "@/components/dashboard/DashboardShell";

export default function BillingHistoryPage() {
  return (
    <DashboardShell
      title="Billing History"
      subtitle="View successful payments and download invoices"
    >
      <BillingHistoryPageClient />
    </DashboardShell>
  );
}
