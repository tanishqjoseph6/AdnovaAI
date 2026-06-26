import DashboardShell from "@/components/dashboard/DashboardShell";
import SettingsPageClient from "@/components/settings/SettingsPageClient";
import {
  getAvatarInitials,
  getSettingsFullName,
} from "@/lib/settings/display";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const email = user?.email ?? "you@company.com";
  const fullName = getSettingsFullName(
    user?.email,
    user?.user_metadata as Record<string, unknown> | null
  );
  const avatarInitials = getAvatarInitials(fullName, email);

  return (
    <DashboardShell
      title="Settings"
      subtitle="Manage your account, profile and preferences"
    >
      <SettingsPageClient
        defaultFullName={fullName || "Advora User"}
        defaultEmail={email}
        avatarInitials={avatarInitials}
      />
    </DashboardShell>
  );
}
