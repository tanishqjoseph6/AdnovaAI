export const SOCIAL_PLATFORMS = [
  "x",
  "linkedin",
  "instagram",
  "facebook",
  "threads",
  "tiktok",
  "youtube",
  "pinterest",
] as const;

export const AVAILABLE_PLATFORMS = ["x", "linkedin"] as const;
export const COMING_SOON_PLATFORMS = [
  "instagram",
  "facebook",
  "threads",
  "tiktok",
  "youtube",
  "pinterest",
] as const;

export const SCHEDULED_POST_STATUSES = [
  "upcoming",
  "published",
  "failed",
] as const;

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];
export type AvailablePlatform = (typeof AVAILABLE_PLATFORMS)[number];
export type ScheduledPostStatus = (typeof SCHEDULED_POST_STATUSES)[number];

export type SocialConnection = {
  id: string;
  platform: SocialPlatform;
  profileId: string | null;
  profileUsername: string | null;
  profileName: string | null;
  profileImageUrl: string | null;
  connectedAt: string;
  updatedAt: string;
};

export type ScheduledPost = {
  id: string;
  platform: SocialPlatform;
  caption: string;
  imageDataUrl: string | null;
  imageUrl: string | null;
  imageStoragePath: string | null;
  scheduledFor: string;
  notes: string | null;
  status: ScheduledPostStatus;
  connectionId: string | null;
  externalPostId: string | null;
  publishedAt: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ScheduledPostsSummary = Record<ScheduledPostStatus, number>;

export type PlatformAvailability = "available" | "coming_soon";

export type PlatformMeta = {
  id: SocialPlatform;
  label: string;
  description: string;
  availability: PlatformAvailability;
  characterLimit: number;
  supportsImages: boolean;
  accentClass: string;
};

export const PLATFORM_META: Record<SocialPlatform, PlatformMeta> = {
  x: {
    id: "x",
    label: "X",
    description: "Short-form updates for fast-moving campaigns.",
    availability: "available",
    characterLimit: 280,
    supportsImages: true,
    accentClass: "from-zinc-400/20 to-zinc-600/10",
  },
  linkedin: {
    id: "linkedin",
    label: "LinkedIn",
    description: "Professional posts for your audience.",
    availability: "available",
    characterLimit: 3000,
    supportsImages: true,
    accentClass: "from-blue-500/20 to-blue-700/10",
  },
  instagram: {
    id: "instagram",
    label: "Instagram",
    description: "Visual-first posts and stories.",
    availability: "coming_soon",
    characterLimit: 2200,
    supportsImages: true,
    accentClass: "from-fuchsia-500/20 to-orange-500/10",
  },
  facebook: {
    id: "facebook",
    label: "Facebook",
    description: "Page updates and community posts.",
    availability: "coming_soon",
    characterLimit: 63206,
    supportsImages: true,
    accentClass: "from-blue-600/20 to-indigo-600/10",
  },
  threads: {
    id: "threads",
    label: "Threads",
    description: "Conversational text updates.",
    availability: "coming_soon",
    characterLimit: 500,
    supportsImages: true,
    accentClass: "from-zinc-300/15 to-zinc-500/10",
  },
  tiktok: {
    id: "tiktok",
    label: "TikTok",
    description: "Short video captions and hooks.",
    availability: "coming_soon",
    characterLimit: 2200,
    supportsImages: false,
    accentClass: "from-pink-500/20 to-cyan-400/10",
  },
  youtube: {
    id: "youtube",
    label: "YouTube",
    description: "Community posts and descriptions.",
    availability: "coming_soon",
    characterLimit: 5000,
    supportsImages: true,
    accentClass: "from-red-500/20 to-red-700/10",
  },
  pinterest: {
    id: "pinterest",
    label: "Pinterest",
    description: "Pins with visual discovery.",
    availability: "coming_soon",
    characterLimit: 500,
    supportsImages: true,
    accentClass: "from-red-400/20 to-rose-600/10",
  },
};

/** @deprecated Use PLATFORM_META[id].label */
export const PLATFORM_LABELS: Record<SocialPlatform, string> =
  Object.fromEntries(
    SOCIAL_PLATFORMS.map((id) => [id, PLATFORM_META[id].label])
  ) as Record<SocialPlatform, string>;

/** @deprecated Use PLATFORM_META[id].description */
export const PLATFORM_DESCRIPTIONS: Record<SocialPlatform, string> =
  Object.fromEntries(
    SOCIAL_PLATFORMS.map((id) => [id, PLATFORM_META[id].description])
  ) as Record<SocialPlatform, string>;

export function isSocialPlatform(value: unknown): value is SocialPlatform {
  return (
    typeof value === "string" &&
    SOCIAL_PLATFORMS.includes(value as SocialPlatform)
  );
}

export function isAvailablePlatform(
  value: unknown
): value is AvailablePlatform {
  return (
    typeof value === "string" &&
    AVAILABLE_PLATFORMS.includes(value as AvailablePlatform)
  );
}

export function isScheduledPostStatus(
  value: unknown
): value is ScheduledPostStatus {
  return (
    typeof value === "string" &&
    SCHEDULED_POST_STATUSES.includes(value as ScheduledPostStatus)
  );
}

export function isPlatformAvailable(platform: SocialPlatform): boolean {
  return PLATFORM_META[platform].availability === "available";
}
