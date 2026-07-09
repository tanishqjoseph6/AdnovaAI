"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import CollapsibleSection from "@/components/history/CollapsibleSection";
import DeleteGenerationDialog from "@/components/history/DeleteGenerationDialog";
import GenerationDate from "@/components/history/GenerationDate";
import type { GenerationRecord, PlanBadge } from "@/lib/history/types";
import {
  getCreditsUsedLabel,
  getGenerationStatus,
  joinSection,
} from "@/lib/history/utils";

type GenerationCardProps = {
  generation: GenerationRecord;
  planBadge: PlanBadge;
  index: number;
  onDelete: (id: string) => Promise<void>;
};

function Badge({
  children,
  variant,
}: {
  children: React.ReactNode;
  variant: "plan-free" | "plan-pro" | "status-completed" | "status-failed";
}) {
  const styles = {
    "plan-free":
      "border-zinc-500/30 bg-zinc-500/10 text-zinc-300",
    "plan-pro":
      "border-violet-500/30 bg-violet-500/10 text-violet-300",
    "status-completed":
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    "status-failed":
      "border-red-500/30 bg-red-500/10 text-red-300",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[variant]}`}
    >
      {children}
    </span>
  );
}

export default function GenerationCard({
  generation,
  planBadge,
  index,
  onDelete,
}: GenerationCardProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const status = getGenerationStatus(generation);
  const isPro = planBadge === "Pro";
  const hooksText = joinSection(generation.hooks);
  const captionsText = joinSection(generation.captions);
  const ctasText = joinSection(generation.ctas);
  const ugcText = generation.ugc_script?.trim() ?? "";

  const handleDelete = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await onDelete(generation.id);
      setDeleteOpen(false);
    } catch {
      setDeleteError("Failed to delete. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

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
              {generation.product_description}
            </h2>
            <p className="mt-1.5 flex items-center gap-1.5 text-sm text-zinc-500">
              <svg
                className="h-4 w-4 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <GenerationDate iso={generation.created_at} />
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <Badge variant={isPro ? "plan-pro" : "plan-free"}>{planBadge}</Badge>
            <Badge
              variant={
                status === "Completed" ? "status-completed" : "status-failed"
              }
            >
              {status}
            </Badge>
            <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-0.5 text-xs font-medium text-cyan-300">
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {getCreditsUsedLabel()}
            </span>
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-xs font-medium text-zinc-400 opacity-100 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300 sm:opacity-0 sm:group-hover:opacity-100"
              aria-label={`Delete ${generation.product_description}`}
            >
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Delete
            </button>
          </div>
        </div>

        {deleteError && (
          <p className="mt-3 text-sm text-red-400" role="alert">
            {deleteError}
          </p>
        )}

        <div className="mt-5 space-y-3">
          {generation.hooks?.length ? (
            <CollapsibleSection title="Hooks" copyText={hooksText}>
              {generation.hooks.map((hook, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-white/[0.04] bg-white/[0.03] px-3 py-2.5 text-sm leading-relaxed text-zinc-300"
                >
                  <span className="mr-2 font-medium text-violet-400">
                    {i + 1}.
                  </span>
                  {hook}
                </div>
              ))}
            </CollapsibleSection>
          ) : null}

          {generation.captions?.length ? (
            <CollapsibleSection title="Captions" copyText={captionsText}>
              {generation.captions.map((caption, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-white/[0.04] bg-white/[0.03] px-3 py-2.5 text-sm leading-relaxed text-zinc-300"
                >
                  <span className="mr-2 font-medium text-cyan-400">
                    {i + 1}.
                  </span>
                  {caption}
                </div>
              ))}
            </CollapsibleSection>
          ) : null}

          {ugcText ? (
            <CollapsibleSection title="UGC Script" copyText={ugcText}>
              <div className="whitespace-pre-wrap rounded-lg border border-white/[0.04] bg-white/[0.03] px-3 py-2.5 text-sm leading-relaxed text-zinc-300">
                {ugcText}
              </div>
            </CollapsibleSection>
          ) : null}

          {generation.ctas?.length ? (
            <CollapsibleSection title="CTA" copyText={ctasText}>
              {generation.ctas.map((cta, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-white/[0.04] bg-white/[0.03] px-3 py-2.5 text-sm leading-relaxed text-zinc-300"
                >
                  <span className="mr-2 font-medium text-fuchsia-400">
                    {i + 1}.
                  </span>
                  {cta}
                </div>
              ))}
            </CollapsibleSection>
          ) : null}
        </div>
      </motion.article>

      <DeleteGenerationDialog
        open={deleteOpen}
        productName={generation.product_description}
        onConfirm={handleDelete}
        onCancel={() => !isDeleting && setDeleteOpen(false)}
        isDeleting={isDeleting}
      />
    </>
  );
}
