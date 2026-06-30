import {
  contentItemKey,
  type ContentKind,
  type EditableGenerationContent,
} from "@/lib/content-editor/types";

export type GenerationContentRow = {
  hooks?: string[] | null;
  captions?: string[] | null;
  ctas?: string[] | null;
  ugc_script?: string | null;
  original_hooks?: string[] | null;
  original_captions?: string[] | null;
  original_ctas?: string[] | null;
  original_ugc_script?: string | null;
  saved_content_items?: unknown;
};

function readStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

export function generationContentFromRow(
  row: GenerationContentRow
): EditableGenerationContent {
  const hooks = readStringArray(row.hooks);
  const captions = readStringArray(row.captions);
  const ctas = readStringArray(row.ctas);
  const ugcScript = row.ugc_script ?? "";

  return {
    hooks,
    captions,
    ctas,
    ugcScript,
    originalHooks: row.original_hooks ? readStringArray(row.original_hooks) : hooks,
    originalCaptions: row.original_captions
      ? readStringArray(row.original_captions)
      : captions,
    originalCtas: row.original_ctas ? readStringArray(row.original_ctas) : ctas,
    originalUgcScript: row.original_ugc_script ?? ugcScript,
    savedContentItems: readStringArray(row.saved_content_items),
  };
}

export function updateContentItem(
  content: EditableGenerationContent,
  kind: ContentKind,
  value: string,
  index?: number
): EditableGenerationContent {
  const next = { ...content };

  if (kind === "hook" && typeof index === "number") {
    next.hooks = content.hooks.map((item, itemIndex) =>
      itemIndex === index ? value : item
    );
  }

  if (kind === "caption" && typeof index === "number") {
    next.captions = content.captions.map((item, itemIndex) =>
      itemIndex === index ? value : item
    );
  }

  if (kind === "cta" && typeof index === "number") {
    next.ctas = content.ctas.map((item, itemIndex) =>
      itemIndex === index ? value : item
    );
  }

  if (kind === "ugcScript") {
    next.ugcScript = value;
  }

  return next;
}

export function deleteContentItem(
  content: EditableGenerationContent,
  kind: ContentKind,
  index?: number
): EditableGenerationContent {
  const deletedKey = contentItemKey(kind, index);
  const savedContentItems = content.savedContentItems.filter(
    (item) => item !== deletedKey
  );

  if (kind === "hook" && typeof index === "number") {
    return {
      ...content,
      hooks: content.hooks.filter((_, itemIndex) => itemIndex !== index),
      savedContentItems,
    };
  }

  if (kind === "caption" && typeof index === "number") {
    return {
      ...content,
      captions: content.captions.filter((_, itemIndex) => itemIndex !== index),
      savedContentItems,
    };
  }

  if (kind === "cta" && typeof index === "number") {
    return {
      ...content,
      ctas: content.ctas.filter((_, itemIndex) => itemIndex !== index),
      savedContentItems,
    };
  }

  if (kind === "ugcScript") {
    return { ...content, ugcScript: "", savedContentItems };
  }

  return content;
}

export function toggleSavedContentItem(
  content: EditableGenerationContent,
  kind: ContentKind,
  saved: boolean,
  index?: number
): EditableGenerationContent {
  const key = contentItemKey(kind, index);
  const existing = new Set(content.savedContentItems);

  if (saved) {
    existing.add(key);
  } else {
    existing.delete(key);
  }

  return {
    ...content,
    savedContentItems: Array.from(existing),
  };
}

export function restoreOriginalContentItem(
  content: EditableGenerationContent,
  kind: ContentKind,
  index?: number
): EditableGenerationContent {
  if (kind === "hook" && typeof index === "number") {
    return updateContentItem(content, kind, content.originalHooks[index] ?? "", index);
  }

  if (kind === "caption" && typeof index === "number") {
    return updateContentItem(
      content,
      kind,
      content.originalCaptions[index] ?? "",
      index
    );
  }

  if (kind === "cta" && typeof index === "number") {
    return updateContentItem(content, kind, content.originalCtas[index] ?? "", index);
  }

  return updateContentItem(content, "ugcScript", content.originalUgcScript);
}

export function contentToGenerationUpdate(content: EditableGenerationContent) {
  return {
    hooks: content.hooks,
    captions: content.captions,
    ctas: content.ctas,
    ugc_script: content.ugcScript,
    original_hooks: content.originalHooks,
    original_captions: content.originalCaptions,
    original_ctas: content.originalCtas,
    original_ugc_script: content.originalUgcScript,
    saved_content_items: content.savedContentItems,
    content_updated_at: new Date().toISOString(),
  };
}
