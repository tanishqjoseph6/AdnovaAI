export const CONTENT_KINDS = ["hook", "caption", "cta", "ugcScript"] as const;

export const REWRITE_ACTIONS = [
  "premium",
  "funnier",
  "sales",
  "emotional",
  "shorter",
  "longer",
  "conversion",
  "creative",
] as const;

export type ContentKind = (typeof CONTENT_KINDS)[number];
export type RewriteAction = (typeof REWRITE_ACTIONS)[number];

export type EditableGenerationContent = {
  hooks: string[];
  captions: string[];
  ctas: string[];
  ugcScript: string;
  originalHooks: string[];
  originalCaptions: string[];
  originalCtas: string[];
  originalUgcScript: string;
  savedContentItems: string[];
};

export type ContentItemPointer = {
  kind: ContentKind;
  index?: number;
};

export const REWRITE_ACTION_LABELS: Record<RewriteAction, string> = {
  premium: "✨ Make Premium",
  funnier: "😂 Make Funnier",
  sales: "💰 More Sales Focused",
  emotional: "❤️ More Emotional",
  shorter: "⚡ Shorter",
  longer: "📖 Longer",
  conversion: "🎯 More Conversion Focused",
  creative: "🧠 More Creative",
};

export function contentItemKey(kind: ContentKind, index?: number): string {
  return kind === "ugcScript" ? "ugcScript" : `${kind}:${index ?? 0}`;
}

export function isContentKind(value: unknown): value is ContentKind {
  return typeof value === "string" && CONTENT_KINDS.includes(value as ContentKind);
}

export function isRewriteAction(value: unknown): value is RewriteAction {
  return typeof value === "string" && REWRITE_ACTIONS.includes(value as RewriteAction);
}
