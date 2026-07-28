import type {
  Campaign,
  CampaignVisibility,
} from "@/lib/social-scheduler/types";

export type CampaignRow = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  color: string;
  visibility: string;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
};

export function campaignFromRow(row: CampaignRow): Campaign {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    color: row.color,
    visibility: (row.visibility === "team" ? "team" : "private") as CampaignVisibility,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function isValidCampaignColor(value: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value.trim());
}
