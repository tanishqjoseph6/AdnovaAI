"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  Clock3,
  MessageSquare,
  Send,
  X,
  XCircle,
} from "lucide-react";
import ActivityTimeline from "@/components/team-approval/ActivityTimeline";
import ApprovalStatusBadge from "@/components/team-approval/ApprovalStatusBadge";
import PlatformIcon from "@/components/social-scheduler/PlatformIcon";
import {
  addComment,
  fetchActivity,
  fetchComments,
} from "@/lib/api/team-approval-client";
import { formatSchedulerDateTime } from "@/lib/social-scheduler/format";
import type { ScheduledPost } from "@/lib/social-scheduler/types";
import type {
  ApprovalActivity,
  ApprovalComment,
  TeamPermissions,
} from "@/lib/team-approval/types";

type ApprovalDetailDrawerProps = {
  post: ScheduledPost | null;
  open: boolean;
  permissions: TeamPermissions;
  onClose: () => void;
  onSubmit: (postId: string) => Promise<void>;
  onApprove: (postId: string) => Promise<void>;
  onReject: (postId: string, reason: string) => Promise<void>;
  onSchedule: (postId: string) => Promise<void>;
};

export default function ApprovalDetailDrawer({
  post,
  open,
  permissions,
  onClose,
  onSubmit,
  onApprove,
  onReject,
  onSchedule,
}: ApprovalDetailDrawerProps) {
  const [comments, setComments] = useState<ApprovalComment[]>([]);
  const [activity, setActivity] = useState<ApprovalActivity[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [comment, setComment] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!post || !open) return;
    let cancelled = false;

    async function load() {
      setLoadingMeta(true);
      setError(null);
      try {
        const [nextComments, nextActivity] = await Promise.all([
          fetchComments(post!.id),
          fetchActivity(post!.id),
        ]);
        if (!cancelled) {
          setComments(nextComments);
          setActivity(nextActivity);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load post details."
          );
        }
      } finally {
        if (!cancelled) setLoadingMeta(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [post, open]);

  if (!post) return null;
  const editingPost = post;

  async function runAction(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Action failed. Try again."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex justify-end">
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            aria-label="Close approval details"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: 48, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 32, opacity: 0 }}
            transition={{ type: "spring", stiffness: 360, damping: 34 }}
            className="relative h-full w-full max-w-lg overflow-y-auto border-l border-white/10 bg-[#0a0618] p-5 shadow-2xl shadow-black/40"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-400">
                  Approval detail
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <ApprovalStatusBadge status={editingPost.status} />
                  <span className="inline-flex items-center gap-1.5 text-xs text-white/50">
                    <PlatformIcon
                      platform={editingPost.platform}
                      className="h-3.5 w-3.5"
                    />
                    {editingPost.platform}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-white/10 p-2 text-white/60 hover:bg-white/5 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-white/85">
              {editingPost.caption}
            </p>
            <p className="mt-2 text-xs text-white/45">
              Planned for {formatSchedulerDateTime(editingPost.scheduledFor)}
            </p>
            {editingPost.rejectionReason ? (
              <p className="mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
                Rejected: {editingPost.rejectionReason}
              </p>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-2">
              {permissions.canSubmit &&
              (editingPost.status === "draft" ||
                editingPost.status === "rejected") ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    void runAction(() => onSubmit(editingPost.id))
                  }
                  className="inline-flex items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-500/15 px-3 py-2 text-sm text-amber-100"
                >
                  <Send className="h-4 w-4" />
                  Submit for approval
                </button>
              ) : null}

              {permissions.canApprove &&
              editingPost.status === "pending_approval" ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    void runAction(() => onApprove(editingPost.id))
                  }
                  className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/15 px-3 py-2 text-sm text-emerald-100"
                >
                  <Check className="h-4 w-4" />
                  Approve
                </button>
              ) : null}

              {permissions.canReject &&
              editingPost.status === "pending_approval" ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setShowReject((value) => !value)}
                  className="inline-flex items-center gap-2 rounded-xl border border-rose-400/30 bg-rose-500/15 px-3 py-2 text-sm text-rose-100"
                >
                  <XCircle className="h-4 w-4" />
                  Reject
                </button>
              ) : null}

              {permissions.canSchedule && editingPost.status === "approved" ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    void runAction(() => onSchedule(editingPost.id))
                  }
                  className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-500/15 px-3 py-2 text-sm text-cyan-100"
                >
                  <Clock3 className="h-4 w-4" />
                  Schedule
                </button>
              ) : null}
            </div>

            {showReject ? (
              <div className="mt-3 space-y-2 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3">
                <textarea
                  value={rejectReason}
                  onChange={(event) => setRejectReason(event.target.value)}
                  rows={3}
                  placeholder="Explain what needs to change…"
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                />
                <button
                  type="button"
                  disabled={busy || rejectReason.trim().length < 3}
                  onClick={() =>
                    void runAction(async () => {
                      await onReject(editingPost.id, rejectReason.trim());
                      setShowReject(false);
                      setRejectReason("");
                    })
                  }
                  className="rounded-xl bg-rose-500/80 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  Confirm rejection
                </button>
              </div>
            ) : null}

            {error ? (
              <p className="mt-3 text-sm text-rose-300">{error}</p>
            ) : null}

            <div className="mt-8">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-white">
                <MessageSquare className="h-4 w-4 text-cyan-300" />
                Comments
              </h4>
              <div className="mt-3 space-y-2">
                {comments.length === 0 && !loadingMeta ? (
                  <p className="text-sm text-white/40">No comments yet.</p>
                ) : null}
                {comments.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2"
                  >
                    <p className="text-[11px] text-white/45">
                      {item.authorEmail} · {item.authorRole}
                    </p>
                    <p className="mt-1 text-sm text-white/80">{item.body}</p>
                  </div>
                ))}
              </div>
              {permissions.canComment ? (
                <div className="mt-3 flex gap-2">
                  <input
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    placeholder="Add a comment…"
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                  />
                  <button
                    type="button"
                    disabled={busy || !comment.trim()}
                    onClick={() =>
                      void runAction(async () => {
                        const created = await addComment(
                          editingPost.id,
                          comment.trim()
                        );
                        setComments((current) => [...current, created]);
                        setComment("");
                        const nextActivity = await fetchActivity(editingPost.id);
                        setActivity(nextActivity);
                      })
                    }
                    className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white disabled:opacity-50"
                  >
                    Post
                  </button>
                </div>
              ) : null}
            </div>

            <div className="mt-8">
              <h4 className="mb-3 text-sm font-semibold text-white">
                Activity timeline
              </h4>
              <ActivityTimeline items={activity} loading={loadingMeta} />
            </div>
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
