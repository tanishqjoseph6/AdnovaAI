import { notFound } from "next/navigation";
import AdminUsersPageClient from "@/components/admin/AdminUsersPageClient";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { isUserAdmin } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isUserAdmin(user.id, user.email))) {
    notFound();
  }

  return (
    <DashboardShell
      title="Admin Users"
      subtitle="View users and manage Admin access"
    >
      <AdminUsersPageClient />
    </DashboardShell>
  );
}
