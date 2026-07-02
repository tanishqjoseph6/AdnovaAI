import { Suspense } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import UserFeedbackPageClient from "@/components/feedback/UserFeedbackPageClient";

export default function FeedbackPage() {
  return (
    <DashboardShell
      title="Feedback"
      subtitle="Track your feedback threads and replies from the Advora team"
    >
      <Suspense
        fallback={
          <div className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-8 text-center text-sm text-zinc-400">
            Loading feedback threads...
          </div>
        }
      >
        <UserFeedbackPageClient />
      </Suspense>
    </DashboardShell>
  );
}
