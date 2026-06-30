"use client";

import { useEffect, useState } from "react";
import {
  contentItemKey,
  REWRITE_ACTION_LABELS,
  type ContentKind,
  type RewriteAction,
} from "@/lib/content-editor/types";
import type { EditableGenerationContent } from "@/lib/content-editor/types";
import CopyButton from "./CopyButton";

type AiOutputProps = {
  data?: {
    hooks?: string[];
    captions?: string[];
    ctas?: string[];
    ugcScript?: string;
    generationId?: string;
    originalHooks?: string[];
    originalCaptions?: string[];
    originalCtas?: string[];
    originalUgcScript?: string;
    savedContentItems?: string[];
  };
  isLoading?: boolean;
};

type EditorStatus = {
  type: "success" | "error" | "loading";
  message: string;
} | null;

type EditableItemProps = {
  generationId?: string;
  kind: ContentKind;
  index?: number;
  text: string;
  originalText: string;
  saved: boolean;
  onContentUpdate: (content: EditableGenerationContent) => void;
};

function toEditorContent(data: AiOutputProps["data"]): EditableGenerationContent {
  const hooks = data?.hooks ?? [];
  const captions = data?.captions ?? [];
  const ctas = data?.ctas ?? [];
  const ugcScript = data?.ugcScript ?? "";

  return {
    hooks,
    captions,
    ctas,
    ugcScript,
    originalHooks: data?.originalHooks ?? hooks,
    originalCaptions: data?.originalCaptions ?? captions,
    originalCtas: data?.originalCtas ?? ctas,
    originalUgcScript: data?.originalUgcScript ?? ugcScript,
    savedContentItems: data?.savedContentItems ?? [],
  };
}

async function patchGenerationContent(input: {
  generationId: string;
  action: "update" | "delete" | "save" | "restore";
  kind: ContentKind;
  index?: number;
  value?: string;
  saved?: boolean;
}): Promise<EditableGenerationContent> {
  const response = await fetch(`/api/generations/${input.generationId}/content`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const payload = (await response.json()) as {
    error?: string;
    content?: EditableGenerationContent;
  };

  if (!response.ok || !payload.content) {
    throw new Error(payload.error ?? "Unable to save this edit.");
  }

  return payload.content;
}

async function rewriteSelectedContent(input: {
  generationId?: string;
  kind: ContentKind;
  action: RewriteAction;
  content: string;
}): Promise<string> {
  const response = await fetch("/api/ai/rewrite-content", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const payload = (await response.json()) as { error?: string; text?: string };

  if (!response.ok || !payload.text) {
    throw new Error(payload.error ?? "Unable to rewrite this content.");
  }

  return payload.text;
}

function EditorButton({
  children,
  onClick,
  disabled = false,
  tone = "default",
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone?: "default" | "danger" | "star";
}) {
  const toneClass =
    tone === "danger"
      ? "hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300"
      : tone === "star"
        ? "hover:border-yellow-500/30 hover:bg-yellow-500/10 hover:text-yellow-200"
        : "hover:border-white/20 hover:bg-white/[0.08] hover:text-white";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs font-medium text-zinc-400 transition disabled:cursor-not-allowed disabled:opacity-50 ${toneClass}`}
    >
      {children}
    </button>
  );
}

function EditableItem({
  generationId,
  kind,
  index,
  text,
  originalText,
  saved,
  onContentUpdate,
}: EditableItemProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(text);
  const [status, setStatus] = useState<EditorStatus>(null);

  useEffect(() => {
    setDraft(text);
  }, [text]);

  const canPersist = Boolean(generationId);
  const changedFromOriginal = text !== originalText;

  async function applyUpdate(value: string) {
    if (!generationId) {
      setStatus({ type: "error", message: "Generate content before editing." });
      return;
    }

    setStatus({ type: "loading", message: "Saving..." });
    try {
      const content = await patchGenerationContent({
        generationId,
        action: "update",
        kind,
        index,
        value,
      });
      onContentUpdate(content);
      setEditing(false);
      setStatus({ type: "success", message: "Saved to history." });
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to save edit.",
      });
    }
  }

  async function handleRewrite(action: RewriteAction) {
    setStatus({ type: "loading", message: "Rewriting selected content..." });
    try {
      const rewritten = await rewriteSelectedContent({
        generationId,
        kind,
        action,
        content: text,
      });
      await applyUpdate(rewritten);
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error instanceof Error ? error.message : "Unable to rewrite content.",
      });
    }
  }

  async function handleDelete() {
    if (!generationId) return;
    setStatus({ type: "loading", message: "Deleting..." });
    try {
      const content = await patchGenerationContent({
        generationId,
        action: "delete",
        kind,
        index,
      });
      onContentUpdate(content);
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to delete.",
      });
    }
  }

  async function handleSaveToggle() {
    if (!generationId) return;
    setStatus({ type: "loading", message: saved ? "Unsaving..." : "Saving..." });
    try {
      const content = await patchGenerationContent({
        generationId,
        action: "save",
        kind,
        index,
        saved: !saved,
      });
      onContentUpdate(content);
      setStatus({
        type: "success",
        message: saved ? "Removed from saved." : "Saved.",
      });
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to save item.",
      });
    }
  }

  async function handleRestore() {
    if (!generationId) return;
    setStatus({ type: "loading", message: "Restoring..." });
    try {
      const content = await patchGenerationContent({
        generationId,
        action: "restore",
        kind,
        index,
      });
      onContentUpdate(content);
      setStatus({ type: "success", message: "Original restored." });
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error instanceof Error ? error.message : "Unable to restore original.",
      });
    }
  }

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-3">
      {editing ? (
        <div className="space-y-3">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            className="min-h-28 w-full resize-y rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm leading-relaxed text-white outline-none transition focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/10"
            autoFocus
          />
          <div className="flex flex-wrap gap-2">
            <EditorButton
              disabled={!canPersist}
              onClick={() => void applyUpdate(draft)}
            >
              Save edit
            </EditorButton>
            <EditorButton
              onClick={() => {
                setDraft(text);
                setEditing(false);
              }}
            >
              Cancel
            </EditorButton>
          </div>
        </div>
      ) : (
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-zinc-200">
          {text}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <EditorButton onClick={() => setEditing(true)}>✏️ Edit</EditorButton>
        <CopyButton text={text} label="📋 Copy" />
        <EditorButton
          disabled={!canPersist}
          tone="star"
          onClick={() => void handleSaveToggle()}
        >
          {saved ? "⭐ Saved" : "⭐ Save"}
        </EditorButton>
        <EditorButton
          disabled={!canPersist}
          onClick={() => void handleRewrite("creative")}
        >
          🔄 Regenerate
        </EditorButton>
        <EditorButton
          disabled={!canPersist}
          tone="danger"
          onClick={() => void handleDelete()}
        >
          🗑 Delete
        </EditorButton>
        {changedFromOriginal && (
          <EditorButton disabled={!canPersist} onClick={() => void handleRestore()}>
            Restore Original
          </EditorButton>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {(Object.keys(REWRITE_ACTION_LABELS) as RewriteAction[]).map((action) => (
          <EditorButton
            key={action}
            disabled={!canPersist}
            onClick={() => void handleRewrite(action)}
          >
            {REWRITE_ACTION_LABELS[action]}
          </EditorButton>
        ))}
      </div>

      {status && (
        <p
          className={`mt-3 text-xs ${
            status.type === "error"
              ? "text-red-300"
              : status.type === "success"
                ? "text-emerald-300"
                : "text-cyan-300"
          }`}
          role={status.type === "error" ? "alert" : "status"}
        >
          {status.message}
        </p>
      )}
    </div>
  );
}

function OutputSection({
  title,
  copyText,
  children,
}: {
  title: string;
  copyText: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="min-w-0 text-lg font-bold sm:text-xl">{title}</h2>
        <CopyButton text={copyText} label={`Copy ${title}`} className="shrink-0" />
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

export default function AiOutput({
  data,
  isLoading = false,
}: AiOutputProps) {
  const [content, setContent] = useState(() => toEditorContent(data));

  useEffect(() => {
    setContent(toEditorContent(data));
  }, [data]);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-white sm:p-6">
        Generating ads...
      </div>
    );
  }

  const savedItems = new Set(content.savedContentItems);

  return (
    <div className="space-y-6 text-white">
      <OutputSection title="Hooks" copyText={content.hooks.join("\n")}>
        {content.hooks.map((hook, index) => (
          <EditableItem
            key={`hook-${index}`}
            generationId={data?.generationId}
            kind="hook"
            index={index}
            text={hook}
            originalText={content.originalHooks[index] ?? hook}
            saved={savedItems.has(contentItemKey("hook", index))}
            onContentUpdate={setContent}
          />
        ))}
      </OutputSection>

      <OutputSection title="Captions" copyText={content.captions.join("\n")}>
        {content.captions.map((caption, index) => (
          <EditableItem
            key={`caption-${index}`}
            generationId={data?.generationId}
            kind="caption"
            index={index}
            text={caption}
            originalText={content.originalCaptions[index] ?? caption}
            saved={savedItems.has(contentItemKey("caption", index))}
            onContentUpdate={setContent}
          />
        ))}
      </OutputSection>

      <OutputSection title="CTAs" copyText={content.ctas.join("\n")}>
        {content.ctas.map((cta, index) => (
          <EditableItem
            key={`cta-${index}`}
            generationId={data?.generationId}
            kind="cta"
            index={index}
            text={cta}
            originalText={content.originalCtas[index] ?? cta}
            saved={savedItems.has(contentItemKey("cta", index))}
            onContentUpdate={setContent}
          />
        ))}
      </OutputSection>

      {content.ugcScript && (
        <OutputSection title="UGC Script" copyText={content.ugcScript}>
          <EditableItem
            generationId={data?.generationId}
            kind="ugcScript"
            text={content.ugcScript}
            originalText={content.originalUgcScript || content.ugcScript}
            saved={savedItems.has(contentItemKey("ugcScript"))}
            onContentUpdate={setContent}
          />
        </OutputSection>
      )}
    </div>
  );
}