"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  getAvatarDisplayName,
  getAvatarInitials,
  getSettingsFullName,
} from "@/lib/settings/display";
import { PROFILE_UPDATED_EVENT } from "@/lib/settings/profile-events";

type UserAvatar = {
  initials: string;
  displayName: string;
  imageUrl: string | null;
};

const DEFAULT_AVATAR: UserAvatar = {
  initials: "U",
  displayName: "",
  imageUrl: null,
};

function avatarFromUser(
  email?: string | null,
  metadata?: Record<string, unknown> | null
): UserAvatar {
  const fullName = getSettingsFullName(email, metadata);
  const rawAvatar = metadata?.avatar_url;
  const imageUrl =
    typeof rawAvatar === "string" && rawAvatar.trim() ? rawAvatar.trim() : null;

  return {
    initials: getAvatarInitials(fullName, email),
    displayName: getAvatarDisplayName(fullName, email),
    imageUrl,
  };
}

export function useUserAvatar(): UserAvatar {
  const [avatar, setAvatar] = useState<UserAvatar>(DEFAULT_AVATAR);

  useEffect(() => {
    const supabase = createClient();

    const syncAvatar = (
      email?: string | null,
      metadata?: Record<string, unknown> | null
    ) => {
      setAvatar(avatarFromUser(email, metadata));
    };

    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        syncAvatar(user.email, user.user_metadata);
      } else {
        setAvatar(DEFAULT_AVATAR);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user;
      if (user) {
        syncAvatar(user.email, user.user_metadata);
      } else {
        setAvatar(DEFAULT_AVATAR);
      }
    });

    function handleProfileUpdated() {
      void supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          syncAvatar(user.email, user.user_metadata);
        }
      });
    }

    window.addEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdated);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdated);
    };
  }, []);

  return avatar;
}
