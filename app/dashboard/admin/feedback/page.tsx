import { notFound } from "next/navigation";
import AdminFeedbackPageClient from "@/components/admin/AdminFeedbackPageClient";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { isUserAdmin } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";

export default async function AdminFeedbackPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isUserAdmin(user.id))) {
    notFound();
  }

  return (
    <DashboardShell
      title="Admin Feedback"
      subtitle="Review beta feedback, reply to users, and manage ticket status"
    >
      <AdminFeedbackPageClient />
    </DashboardShell>
  );
}
