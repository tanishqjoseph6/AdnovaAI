"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import DeleteGenerationDialog from "@/components/history/DeleteGenerationDialog";
import GenerationDate from "@/components/history/GenerationDate";
import type { PlanBadge } from "@/lib/history/types";
import type { ThumbnailRecord } from "@/lib/thumbnail/types";
import { THUMBNAIL_FORMAT_LABELS } from "@/lib/thumbnail/types";

type ThumbnailHistoryCardProps = {
  record: ThumbnailRecord;
  planBadge: PlanBadge;
  index: number;
  onDelete: (id: string) => Promise<void>;
};

export default function ThumbnailHistoryCard({
  record,
  planBadge,
  index,
  onDelete,
}: ThumbnailHistoryCardProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const preview = record.result.variations[0];
  const isPro = planBadge === "Pro";

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
        className="group glass overflow-hidden rounded-2xl border border-white/[0.08] shadow-lg shadow-black/20 transition hover:border-white/[0.14] hover:shadow-xl hover:shadow-violet-500/5"
      >
        {preview ? (
          <div className="aspect-video overflow-hidden bg-[#090712]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview.imageUrl}
              alt={preview.headline}
              className="h-full w-full object-cover"
            />
          </div>
        ) : null}

        <div className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-lg font-semibold tracking-tight text-white sm:text-xl">
                {record.brand_name} · Thumbnail
              </h2>
              <p className="mt-1.5 text-sm text-zinc-500">
                <GenerationDate iso={record.created_at} />
              </p>
              <p className="mt-2 line-clamp-2 text-sm text-zinc-400">
                {record.prompt}
              </p>
              <p className="mt-2 text-xs text-zinc-500">
                {THUMBNAIL_FORMAT_LABELS[record.format]} ·{" "}
                {record.result.variations.length} variation
                {record.result.variations.length === 1 ? "" : "s"}
              </p>
              {preview ? (
                <p className="mt-2 text-sm text-cyan-300">{preview.headline}</p>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                  isPro
                    ? "border-violet-500/30 bg-violet-500/10 text-violet-200"
                    : "border-white/10 bg-white/[0.04] text-zinc-300"
                }`}
              >
                {planBadge}
              </span>
              <button
                type="button"
                onClick={() => setDeleteOpen(true)}
                className="rounded-lg border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-300 transition hover:bg-red-500/15"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </motion.article>

      <DeleteGenerationDialog
        open={deleteOpen}
        productName={`${record.brand_name} thumbnail`}
        isDeleting={isDeleting}
        onCancel={() => !isDeleting && setDeleteOpen(false)}
        onConfirm={() => void handleDelete()}
      />
    </>
  );
}
