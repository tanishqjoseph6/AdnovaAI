export type GenerationRecord = {
  id: string;
  product_description: string;
  created_at: string;
  hooks: string[] | null;
  captions: string[] | null;
  ctas: string[] | null;
  ugc_script: string | null;
  user_email?: string | null;
};

export type HistoryFilter = "today" | "week" | "month" | "all";
export type HistorySort = "newest" | "oldest";

export type PlanBadge = "Free" | "Pro";
