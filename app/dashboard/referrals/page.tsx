import DashboardShell from "@/components/dashboard/DashboardShell";
import ReferralPageClient from "@/components/referrals/ReferralPageClient";

export default async function ReferralsPage() {
  return (
    <DashboardShell
      title="Referrals"
      subtitle="Invite verified creators and earn credits or a free Starter month"
    >
      <ReferralPageClient />
    </DashboardShell>
  );
}
