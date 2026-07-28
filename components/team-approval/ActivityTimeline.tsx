"use client";

import { motion } from "framer-motion";
import type { ApprovalActivity } from "@/lib/team-approval/types";

const ACTION_LABELS: Record<string, string> = {
  created: "Created",
  submitted: "Submitted",
  resubmitted: "Resubmitted",
  approved: "Approved",
  rejected: "Rejected",
  scheduled: "Scheduled",
  published: "Published",
  commented: "Commented",
  edited: "Edited",
};

export default function ActivityTimeline({
  items,
  loading,
}: {
  items: ApprovalActivity[];
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-14 animate-pulse rounded-xl border border-white/10 bg-white/[0.03]"
          />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-6 text-center text-sm text-white/45">
        No activity yet. Actions will appear here as the post moves through approval.
      </p>
    );
  }

  return (
    <ol className="relative space-y-3 border-l border-white/10 pl-4">
      {items.map((item, index) => (
        <motion.li
          key={item.id}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.04 }}
          className="relative"
        >
          <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full border border-cyan-300/40 bg-cyan-400/70" />
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-white">
                {ACTION_LABELS[item.action] ?? item.action}
              </p>
              <time className="text-[11px] text-white/40">
                {new Date(item.createdAt).toLocaleString()}
              </time>
            </div>
            <p className="mt-1 text-xs text-white/55">
              {item.actorEmail ?? "System"}
              {item.actorRole ? ` · ${item.actorRole}` : ""}
            </p>
            {item.message ? (
              <p className="mt-1.5 text-sm text-white/70">{item.message}</p>
            ) : null}
          </div>
        </motion.li>
      ))}
    </ol>
  );
}
