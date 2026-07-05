"use client";

export const PROFILE_UPDATED_EVENT = "advora:profile-updated";

export type ProfileUpdatedDetail = {
  avatarUrl?: string | null;
  fullName?: string;
  username?: string;
};

export function dispatchProfileUpdated(detail?: ProfileUpdatedDetail) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<ProfileUpdatedDetail>(PROFILE_UPDATED_EVENT, {
      detail,
    })
  );
}

export async function refreshAuthSession() {
  const { supabase } = await import("@/lib/supabase");
  await supabase.auth.refreshSession();
}
