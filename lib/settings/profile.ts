import { isAllowedAvatarUrl } from "@/lib/settings/avatar";

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 30;

export type ProfileSettingsInput = {
  username: string;
  fullName: string;
  avatarUrl?: string | null;
};

export type NormalizedProfileSettings = {
  username: string;
  fullName: string;
  avatarUrl: string | null;
};

export type ProfileSettingsValidation =
  | { ok: true; value: NormalizedProfileSettings }
  | { ok: false; error: string };

export function normalizeUsername(value: string): string {
  return value.trim();
}

export function validateProfileSettings(
  input: ProfileSettingsInput
): ProfileSettingsValidation {
  const username = normalizeUsername(input.username);
  const fullName = input.fullName.trim().replace(/\s+/g, " ");
  const avatarUrl = input.avatarUrl?.trim() || null;

  if (!username) {
    return { ok: false, error: "Username is required." };
  }

  if (
    username.length < USERNAME_MIN_LENGTH ||
    username.length > USERNAME_MAX_LENGTH
  ) {
    return {
      ok: false,
      error: `Username must be between ${USERNAME_MIN_LENGTH} and ${USERNAME_MAX_LENGTH} characters.`,
    };
  }

  if (!/^[a-zA-Z0-9._-]+$/.test(username)) {
    return {
      ok: false,
      error: "Username can only use letters, numbers, dots, underscores, and hyphens.",
    };
  }

  if (avatarUrl && !isAllowedAvatarUrl(avatarUrl)) {
    return {
      ok: false,
      error: "Profile photo must be uploaded through Advora.",
    };
  }

  return {
    ok: true,
    value: {
      username,
      fullName,
      avatarUrl,
    },
  };
}

export function getDefaultUsername(email: string | null | undefined): string {
  const localPart = email?.split("@")[0]?.trim() || "user";
  const normalized = localPart
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "")
    .slice(0, USERNAME_MAX_LENGTH);

  if (normalized.length >= USERNAME_MIN_LENGTH) {
    return normalized;
  }

  return normalized.padEnd(USERNAME_MIN_LENGTH, "0");
}

export function isDuplicateUsernameError(message: string): boolean {
  return /profiles_username_lower_unique|duplicate key|unique constraint/i.test(
    message
  );
}
