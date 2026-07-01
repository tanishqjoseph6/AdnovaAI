export const SOCIAL_PLATFORMS = ["instagram", "facebook", "linkedin", "x"] as const;
export const SCHEDULED_POST_STATUSES = ["upcoming", "published", "failed"] as const;

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];
export type ScheduledPostStatus = (typeof SCHEDULED_POST_STATUSES)[number];

export type ScheduledPost = {
  id: string;
  platform: SocialPlatform;
  caption: string;
  imageDataUrl: string | null;
  scheduledFor: string;
  notes: string | null;
  status: ScheduledPostStatus;
  createdAt: string;
  updatedAt: string;
};

export type ScheduledPostsSummary = Record<ScheduledPostStatus, number>;

export const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  x: "X",
};

export const PLATFORM_DESCRIPTIONS: Record<SocialPlatform, string> = {
  instagram: "Schedule visual-first posts and launch reminders.",
  facebook: "Plan page updates and community posts.",
  linkedin: "Prepare thought leadership posts for your audience.",
  x: "Draft short updates for fast-moving campaigns.",
};

export function isSocialPlatform(value: unknown): value is SocialPlatform {
  return typeof value === "string" && SOCIAL_PLATFORMS.includes(value as SocialPlatform);
}

export function isScheduledPostStatus(
  value: unknown
): value is ScheduledPostStatus {
  return (
    typeof value === "string" &&
    SCHEDULED_POST_STATUSES.includes(value as ScheduledPostStatus)
  );
}
