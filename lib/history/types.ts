import type { CompetitorAnalysisRecord } from "@/lib/competitor-ad/types";
import type { ReelScriptRecord } from "@/lib/reel-script/types";
import type { ThumbnailRecord } from "@/lib/thumbnail/types";

export type { CompetitorAnalysisRecord, ReelScriptRecord, ThumbnailRecord };

export type GenerationRecord = {
  id: string;
  product_description: string;
  created_at: string;
  hooks: string[] | null;
  captions: string[] | null;
  ctas: string[] | null;
  ugc_script: string | null;
  original_hooks?: string[] | null;
  original_captions?: string[] | null;
  original_ctas?: string[] | null;
  original_ugc_script?: string | null;
  saved_content_items?: string[] | null;
  user_email?: string | null;
};

export type HistoryEntry =
  | { kind: "generation"; record: GenerationRecord }
  | { kind: "competitor"; record: CompetitorAnalysisRecord }
  | { kind: "reel_script"; record: ReelScriptRecord }
  | { kind: "thumbnail"; record: ThumbnailRecord };

export type HistoryFilter = "today" | "week" | "month" | "all";
export type HistorySort = "newest" | "oldest";

export type PlanBadge = "Free" | "Pro";
