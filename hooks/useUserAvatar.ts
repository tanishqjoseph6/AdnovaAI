"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  getAvatarDisplayName,
  getAvatarInitials,
  getSettingsFullName,
} from "@/lib/settings/display";

type UserAvatar = {
  initials: string;
  displayName: string;
};

const DEFAULT_AVATAR: UserAvatar = {
  initials: "U",
  displayName: "",
};

function avatarFromUser(
  email?: string | null,
  metadata?: Record<string, unknown> | null
): UserAvatar {
  const fullName = getSettingsFullName(email, metadata);
  return {
    initials: getAvatarInitials(fullName, email),
    displayName: getAvatarDisplayName(fullName, email),
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

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return avatar;
}
