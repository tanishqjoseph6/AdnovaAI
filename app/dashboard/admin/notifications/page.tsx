import { notFound } from "next/navigation";
import AdminNotificationsPageClient from "@/components/admin/AdminNotificationsPageClient";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { isUserAdmin } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";

export default async function AdminNotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isUserAdmin(user.id))) {
    notFound();
  }

  return (
    <DashboardShell
      title="Admin Notifications"
      subtitle="Review and send in-app notifications"
    >
      <AdminNotificationsPageClient />
    </DashboardShell>
  );
}
