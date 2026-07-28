import {
  isScheduledPostStatus,
  isSocialPlatform,
  PLATFORM_META,
  type ScheduledPostStatus,
  type SocialPlatform,
} from "@/lib/social-scheduler/types";

export type ScheduledPostInput = {
  platform: SocialPlatform;
  caption: string;
  imageDataUrl: string | null;
  imageUrl: string | null;
  imageStoragePath: string | null;
  scheduledFor: string;
  notes: string | null;
  status: ScheduledPostStatus;
  campaignId: string | null;
  campaignColor: string | null;
  publishNow?: boolean;
};

export type ScheduledPostValidation =
  | { ok: true; value: ScheduledPostInput }
  | { ok: false; error: string };

function normalizeNullableText(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.slice(0, maxLength);
}

export function validateScheduledPostInput(
  input: Record<string, unknown>,
  options: { allowStatus?: boolean } = {}
): ScheduledPostValidation {
  if (!isSocialPlatform(input.platform)) {
    return { ok: false, error: "Choose a valid social platform." };
  }

  const caption = typeof input.caption === "string" ? input.caption.trim() : "";
  if (!caption) {
    return { ok: false, error: "Caption is required." };
  }

  const characterLimit = PLATFORM_META[input.platform].characterLimit;
  if (caption.length > characterLimit) {
    return {
      ok: false,
      error: `Caption must be ${characterLimit.toLocaleString()} characters or fewer.`,
    };
  }

  const publishNow = input.publishNow === true;
  const status =
    options.allowStatus && isScheduledPostStatus(input.status)
      ? input.status
      : input.status === "draft"
        ? "draft"
        : "upcoming";

  const scheduledFor =
    typeof input.scheduledFor === "string" ? input.scheduledFor : "";
  const scheduledDate = new Date(scheduledFor);
  if (!scheduledFor || Number.isNaN(scheduledDate.getTime())) {
    return { ok: false, error: "Choose a valid date and time." };
  }

  if (
    !publishNow &&
    status !== "draft" &&
    status !== "pending_approval" &&
    status !== "approved" &&
    status !== "rejected" &&
    scheduledDate.getTime() < Date.now() - 60_000
  ) {
    return {
      ok: false,
      error: "Scheduled time must be in the future.",
    };
  }

  const imageDataUrl = normalizeNullableText(input.imageDataUrl, 1_000_000);
  if (imageDataUrl && !imageDataUrl.startsWith("data:image/")) {
    return { ok: false, error: "Upload a valid image file." };
  }

  const imageUrl = normalizeNullableText(input.imageUrl, 2000);
  const imageStoragePath = normalizeNullableText(input.imageStoragePath, 500);

  const campaignId =
    typeof input.campaignId === "string" && input.campaignId.trim()
      ? input.campaignId.trim()
      : null;
  const campaignColorRaw = normalizeNullableText(input.campaignColor, 16);
  const campaignColor =
    campaignColorRaw &&
    /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(campaignColorRaw)
      ? campaignColorRaw
      : null;

  return {
    ok: true,
    value: {
      platform: input.platform,
      caption,
      imageDataUrl,
      imageUrl,
      imageStoragePath,
      scheduledFor: publishNow
        ? new Date().toISOString()
        : scheduledDate.toISOString(),
      notes: normalizeNullableText(input.notes, 1000),
      status,
      campaignId,
      campaignColor,
      publishNow,
    },
  };
}
