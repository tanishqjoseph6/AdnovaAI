"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";

type EditableChipListProps = {
  items: string[];
  onChange: (items: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
  addLabel?: string;
};

export default function EditableChipList({
  items,
  onChange,
  disabled = false,
  placeholder = "Add item...",
  addLabel = "Add",
}: EditableChipListProps) {
  const [draft, setDraft] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  const addItem = () => {
    const value = draft.trim();
    if (!value || items.includes(value)) {
      setDraft("");
      return;
    }
    onChange([...items, value]);
    setDraft("");
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
      setEditValue("");
    }
  };

  const startEdit = (index: number) => {
    if (disabled) return;
    setEditingIndex(index);
    setEditValue(items[index] ?? "");
  };

  const commitEdit = () => {
    if (editingIndex === null) return;

    const value = editValue.trim();
    if (!value) {
      removeItem(editingIndex);
    } else {
      const next = [...items];
      next[editingIndex] = value;
      onChange(next);
    }

    setEditingIndex(null);
    setEditValue("");
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {items.map((item, index) =>
          editingIndex === index ? (
            <input
              key={`${item}-${index}-edit`}
              autoFocus
              value={editValue}
              disabled={disabled}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitEdit();
                }
                if (e.key === "Escape") {
                  setEditingIndex(null);
                  setEditValue("");
                }
              }}
              className="min-w-[7rem] rounded-full border border-cyan-400/40 bg-white/[0.05] px-3 py-1.5 text-xs text-white outline-none"
            />
          ) : (
            <span
              key={`${item}-${index}`}
              className="inline-flex max-w-full items-center gap-1 rounded-full border border-violet-500/25 bg-violet-500/10 pl-3 pr-1.5 py-1 text-xs font-medium text-violet-100"
            >
              <button
                type="button"
                disabled={disabled}
                onClick={() => startEdit(index)}
                className="truncate text-left transition hover:text-white disabled:cursor-not-allowed"
              >
                {item}
              </button>
              <button
                type="button"
                disabled={disabled}
                onClick={() => removeItem(index)}
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-violet-300/80 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={`Remove ${item}`}
              >
                <X className="h-3 w-3" aria-hidden />
              </button>
            </span>
          )
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          disabled={disabled}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addItem();
            }
          }}
          placeholder={placeholder}
          className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-zinc-600 outline-none transition focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/10 disabled:opacity-50"
        />
        <button
          type="button"
          disabled={disabled || !draft.trim()}
          onClick={addItem}
          className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-zinc-300 transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          {addLabel}
        </button>
      </div>
    </div>
  );
}
