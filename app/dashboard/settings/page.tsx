import DashboardShell from "@/components/dashboard/DashboardShell";
import SettingsPageClient from "@/components/settings/SettingsPageClient";
import { aiPreferencesToApiResponse } from "@/lib/settings/ai-preferences";
import { getAiPreferencesForUser } from "@/lib/settings/ai-preferences-server";
import {
  getAvatarInitials,
  getSettingsFullName,
} from "@/lib/settings/display";
import { getDefaultUsername } from "@/lib/settings/profile";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const email = user?.email ?? "you@company.com";
  const metadataFullName = getSettingsFullName(
    user?.email,
    user?.user_metadata as Record<string, unknown> | null
  );
  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("username, full_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };

  const aiPreferences = user
    ? aiPreferencesToApiResponse(
        await getAiPreferencesForUser(supabase, user.id)
      )
    : null;

  const fullName =
    typeof profile?.full_name === "string" && profile.full_name.trim()
      ? profile.full_name.trim()
      : metadataFullName;
  const username =
    typeof profile?.username === "string" && profile.username.trim()
      ? profile.username.trim()
      : typeof user?.user_metadata?.username === "string"
        ? user.user_metadata.username
        : getDefaultUsername(email);
  const avatarUrl =
    typeof profile?.avatar_url === "string" ? profile.avatar_url : "";
  const avatarInitials = getAvatarInitials(fullName, email);

  return (
    <DashboardShell
      title="Settings"
      subtitle="Manage your account, profile and AI preferences"
    >
      <SettingsPageClient
        defaultFullName={fullName || "Advora User"}
        defaultEmail={email}
        defaultUsername={username}
        defaultAvatarUrl={avatarUrl}
        avatarInitials={avatarInitials}
        initialAiPreferences={aiPreferences}
      />
    </DashboardShell>
  );
}
