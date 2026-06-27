import type {
  CompetitorAnalysisRecord,
  GenerationRecord,
  HistoryEntry,
  HistoryFilter,
  HistorySort,
} from "./types";

const GENERATION_DATE_FORMAT_OPTIONS = {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
} as const;

/** Deterministic en-US UTC formatting — identical on server and client. */
const generationDateFormatterUtc = new Intl.DateTimeFormat(
  "en-US",
  {
    ...GENERATION_DATE_FORMAT_OPTIONS,
    timeZone: "UTC",
  }
);

export function formatGenerationDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return generationDateFormatterUtc.format(date);
}

/** Local timezone display — use only after hydration on the client. */
export function formatGenerationDateLocal(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return new Intl.DateTimeFormat("en-US", GENERATION_DATE_FORMAT_OPTIONS).format(
    date
  );
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfWeek(date: Date): Date {
  const d = startOfDay(date);
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  return d;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function matchesDateFilter(
  createdAt: string,
  filter: HistoryFilter
): boolean {
  if (filter === "all") return true;

  const created = new Date(createdAt);
  const now = new Date();

  switch (filter) {
    case "today":
      return created >= startOfDay(now);
    case "week":
      return created >= startOfWeek(now);
    case "month":
      return created >= startOfMonth(now);
    default:
      return true;
  }
}

export function matchesSearchQuery(
  generation: GenerationRecord,
  query: string
): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  const parts = [
    generation.product_description,
    ...(generation.hooks ?? []),
    ...(generation.captions ?? []),
    ...(generation.ctas ?? []),
    generation.ugc_script ?? "",
  ];

  return parts.some((part) => part.toLowerCase().includes(normalized));
}

export function matchesSearchQueryForCompetitor(
  record: CompetitorAnalysisRecord,
  query: string
): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  const { analysis, better_ad: betterAd } = record;
  const parts = [
    record.image_name ?? "",
    analysis.brand,
    analysis.product,
    analysis.platform,
    analysis.ad_objective,
    analysis.hook_analysis,
    analysis.cta_analysis,
    ...analysis.suggestions.what_makes_successful,
    ...analysis.suggestions.weaknesses,
    ...analysis.suggestions.how_to_outperform,
    ...(betterAd?.hooks ?? []),
    ...(betterAd?.captions ?? []),
    ...(betterAd?.ctas ?? []),
    betterAd?.ugcScript ?? "",
  ];

  return parts.some((part) => part.toLowerCase().includes(normalized));
}

export function matchesSearchQueryForEntry(
  entry: HistoryEntry,
  query: string
): boolean {
  if (entry.kind === "generation") {
    return matchesSearchQuery(entry.record, query);
  }

  return matchesSearchQueryForCompetitor(entry.record, query);
}

export function sortGenerations(
  items: GenerationRecord[],
  sort: HistorySort
): GenerationRecord[] {
  return [...items].sort((a, b) => {
    const aTime = new Date(a.created_at).getTime();
    const bTime = new Date(b.created_at).getTime();
    return sort === "newest" ? bTime - aTime : aTime - bTime;
  });
}

export function sortHistoryEntries(
  items: HistoryEntry[],
  sort: HistorySort
): HistoryEntry[] {
  return [...items].sort((a, b) => {
    const aTime = new Date(a.record.created_at).getTime();
    const bTime = new Date(b.record.created_at).getTime();
    return sort === "newest" ? bTime - aTime : aTime - bTime;
  });
}

export function joinSection(items: string[] | null | undefined): string {
  if (!items?.length) return "";
  return items.map((item, index) => `${index + 1}. ${item}`).join("\n\n");
}

export function getGenerationStatus(
  generation: GenerationRecord
): "Completed" | "Failed" {
  const hasContent =
    Boolean(generation.hooks?.length) ||
    Boolean(generation.captions?.length) ||
    Boolean(generation.ctas?.length) ||
    Boolean(generation.ugc_script?.trim());

  return hasContent ? "Completed" : "Failed";
}

export function getCreditsUsedLabel(isPro: boolean): string {
  return isPro ? "Unlimited" : "1 credit";
}
