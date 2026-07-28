"use client";

import { motion } from "framer-motion";
import ApprovalStatusBadge from "@/components/team-approval/ApprovalStatusBadge";
import PlatformIcon from "@/components/social-scheduler/PlatformIcon";
import { formatSchedulerDateTime } from "@/lib/social-scheduler/format";
import type { ScheduledPost } from "@/lib/social-scheduler/types";
import {
  APPROVAL_STATUS_LABELS,
  type ApprovalWorkflowStatus,
} from "@/lib/team-approval/types";

const FILTERS: Array<ApprovalWorkflowStatus | "all"> = [
  "all",
  "draft",
  "pending_approval",
  "approved",
  "upcoming",
  "published",
  "rejected",
  "failed",
];

type ApprovalQueueProps = {
  posts: ScheduledPost[];
  statusFilter: ApprovalWorkflowStatus | "all";
  search: string;
  onStatusFilterChange: (value: ApprovalWorkflowStatus | "all") => void;
  onSearchChange: (value: string) => void;
  onSelect: (post: ScheduledPost) => void;
};

export default function ApprovalQueue({
  posts,
  statusFilter,
  search,
  onStatusFilterChange,
  onSearchChange,
  onSelect,
}: ApprovalQueueProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-300">
            Queue
          </p>
          <h3 className="mt-1 text-lg font-semibold text-white">
            Approval history & pipeline
          </h3>
        </div>
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search captions, notes…"
          className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none ring-violet-400/20 placeholder:text-white/30 focus:ring-2 sm:max-w-xs"
        />
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((filter) => {
          const active = statusFilter === filter;
          return (
            <button
              key={filter}
              type="button"
              onClick={() => onStatusFilterChange(filter)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                active
                  ? "border-violet-400/40 bg-violet-500/20 text-violet-100"
                  : "border-white/10 bg-black/20 text-white/55 hover:text-white"
              }`}
            >
              {filter === "all"
                ? "All"
                : APPROVAL_STATUS_LABELS[filter]}
            </button>
          );
        })}
      </div>

      <div className="mt-4 space-y-2">
        {posts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 px-4 py-12 text-center">
            <p className="text-sm font-medium text-white/70">
              No posts in this view
            </p>
            <p className="mt-1 text-sm text-white/40">
              Create a draft in Social Scheduler, then submit it for approval.
            </p>
          </div>
        ) : (
          posts.map((post, index) => (
            <motion.button
              key={post.id}
              type="button"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.03, 0.24) }}
              onClick={() => onSelect(post)}
              className="flex w-full items-start gap-3 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-transparent px-4 py-3 text-left transition hover:border-violet-400/30 hover:from-violet-500/10"
            >
              <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-black/30 text-white">
                <PlatformIcon platform={post.platform} className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <ApprovalStatusBadge status={post.status} />
                  <span className="text-[11px] text-white/40">
                    {formatSchedulerDateTime(post.scheduledFor)}
                  </span>
                </div>
                <p className="mt-1.5 line-clamp-2 text-sm text-white/85">
                  {post.caption}
                </p>
              </div>
            </motion.button>
          ))
        )}
      </div>
    </section>
  );
}
