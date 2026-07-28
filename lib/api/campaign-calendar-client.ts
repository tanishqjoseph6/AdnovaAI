import type { Campaign } from "@/lib/social-scheduler/types";
import type { ScheduledPost } from "@/lib/social-scheduler/types";

export async function fetchCampaigns(): Promise<Campaign[]> {
  const response = await fetch("/api/campaigns", { cache: "no-store" });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      typeof payload.error === "string" ? payload.error : "Failed to load campaigns"
    );
  }
  return Array.isArray(payload.campaigns) ? payload.campaigns : [];
}

export async function createCampaign(input: {
  name: string;
  color?: string;
  visibility?: "private" | "team";
  description?: string;
}): Promise<Campaign> {
  const response = await fetch("/api/campaigns", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.campaign) {
    throw new Error(
      typeof payload.error === "string" ? payload.error : "Failed to create campaign"
    );
  }
  return payload.campaign as Campaign;
}

export async function reschedulePost(
  id: string,
  scheduledFor: string
): Promise<ScheduledPost> {
  const response = await fetch(`/api/scheduled-posts/${id}/reschedule`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scheduledFor }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.post) {
    throw new Error(
      typeof payload.error === "string" ? payload.error : "Failed to reschedule"
    );
  }
  return payload.post as ScheduledPost;
}

export async function duplicatePost(
  id: string,
  scheduledFor?: string
): Promise<ScheduledPost> {
  const response = await fetch(`/api/scheduled-posts/${id}/duplicate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(scheduledFor ? { scheduledFor } : {}),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.post) {
    throw new Error(
      typeof payload.error === "string" ? payload.error : "Failed to duplicate"
    );
  }
  return payload.post as ScheduledPost;
}

export async function deleteScheduledPost(id: string): Promise<void> {
  const response = await fetch(`/api/scheduled-posts/${id}`, {
    method: "DELETE",
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      typeof payload.error === "string" ? payload.error : "Failed to delete"
    );
  }
}

export async function updateScheduledPost(
  id: string,
  body: Record<string, unknown>
): Promise<ScheduledPost> {
  const response = await fetch(`/api/scheduled-posts/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.post) {
    throw new Error(
      typeof payload.error === "string" ? payload.error : "Failed to update post"
    );
  }
  return payload.post as ScheduledPost;
}

export async function fetchScheduledPosts(): Promise<ScheduledPost[]> {
  const response = await fetch("/api/scheduled-posts", { cache: "no-store" });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      typeof payload.error === "string" ? payload.error : "Failed to load posts"
    );
  }
  return Array.isArray(payload.posts) ? payload.posts : [];
}
