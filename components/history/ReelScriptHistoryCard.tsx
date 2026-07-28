"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import CollapsibleSection from "@/components/history/CollapsibleSection";
import DeleteGenerationDialog from "@/components/history/DeleteGenerationDialog";
import GenerationDate from "@/components/history/GenerationDate";
import type { PlanBadge } from "@/lib/history/types";
import type { ReelScriptRecord } from "@/lib/reel-script/types";
import {
  REEL_GOAL_LABELS,
  REEL_PLATFORM_LABELS,
} from "@/lib/reel-script/types";
import { formatReelScriptForExport } from "@/lib/reel-script/normalize";

type ReelScriptHistoryCardProps = {
  record: ReelScriptRecord;
  planBadge: PlanBadge;
  index: number;
  onDelete: (id: string) => Promise<void>;
};

export default function ReelScriptHistoryCard({
  record,
  planBadge,
  index,
  onDelete,
}: ReelScriptHistoryCardProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isPro = planBadge === "Pro";
  const exportText = formatReelScriptForExport(record.result, {
    brandName: record.brand_name,
    platform: REEL_PLATFORM_LABELS[record.platform],
    duration: record.duration,
  });

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await onDelete(record.id);
      setDeleteOpen(false);
    } catch {
      // Keep dialog open so the user can retry.
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <motion.article
        layout
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: -8 }}
        transition={{ duration: 0.35, delay: index * 0.04 }}
        className="group glass rounded-2xl border border-white/[0.08] p-5 shadow-lg shadow-black/20 transition hover:border-white/[0.14] hover:shadow-xl hover:shadow-violet-500/5 sm:p-6"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-semibold tracking-tight text-white sm:text-xl">
              {record.brand_name} · Reel Script
            </h2>
            <p className="mt-1.5 text-sm text-zinc-500">
              <GenerationDate iso={record.created_at} />
            </p>
            <p className="mt-2 line-clamp-2 text-sm text-zinc-400">
              {record.product_description}
            </p>
            <p className="mt-2 text-xs text-zinc-500">
              {REEL_PLATFORM_LABELS[record.platform]} · {record.duration}s ·{" "}
              {REEL_GOAL_LABELS[record.goal]}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                isPro
                  ? "border-violet-500/30 bg-violet-500/10 text-violet-300"
                  : "border-zinc-500/30 bg-zinc-500/10 text-zinc-300"
              }`}
            >
              {planBadge}
            </span>
            <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-300">
              Completed
            </span>
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              className="rounded-lg border border-red-500/20 bg-red-500/10 px-2.5 py-1.5 text-xs font-medium text-red-300 transition hover:bg-red-500/15"
            >
              Delete
            </button>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <CollapsibleSection
            title="Hooks"
            copyText={record.result.hooks
              .map((hook, i) => `${i + 1}. ${hook}`)
              .join("\n")}
            defaultOpen
          >
            <pre className="whitespace-pre-wrap text-sm text-zinc-300">
              {record.result.hooks
                .map((hook, i) => `${i + 1}. ${hook}`)
                .join("\n")}
            </pre>
          </CollapsibleSection>
          <CollapsibleSection
            title="Opening"
            copyText={record.result.scrollStoppingOpening}
          >
            <p className="text-sm text-zinc-300">
              {record.result.scrollStoppingOpening}
            </p>
          </CollapsibleSection>
          <CollapsibleSection title="Full Export" copyText={exportText}>
            <pre className="max-h-64 overflow-auto whitespace-pre-wrap text-xs text-zinc-400">
              {exportText}
            </pre>
          </CollapsibleSection>
        </div>
      </motion.article>

      <DeleteGenerationDialog
        open={deleteOpen}
        productName={`${record.brand_name} reel script`}
        isDeleting={isDeleting}
        onCancel={() => !isDeleting && setDeleteOpen(false)}
        onConfirm={() => void handleDelete()}
      />
    </>
  );
}
