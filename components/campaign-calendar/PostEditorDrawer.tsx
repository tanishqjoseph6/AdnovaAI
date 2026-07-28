"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Copy, Trash2, X } from "lucide-react";
import {
  PLATFORM_META,
  SCHEDULED_POST_STATUSES,
  type Campaign,
  type ScheduledPost,
  type ScheduledPostStatus,
  type SocialPlatform,
  AVAILABLE_PLATFORMS,
} from "@/lib/social-scheduler/types";
import { CALENDAR_STATUS_LABELS, toLocalParts } from "@/lib/campaign-calendar/utils";
import { localDateTimeToIso } from "@/lib/social-scheduler/format";

type PostEditorDrawerProps = {
  post: ScheduledPost | null;
  campaigns: Campaign[];
  open: boolean;
  onClose: () => void;
  onSave: (postId: string, body: Record<string, unknown>) => Promise<void>;
  onDuplicate: (postId: string) => Promise<void>;
  onDelete: (postId: string) => Promise<void>;
};

export default function PostEditorDrawer({
  post,
  campaigns,
  open,
  onClose,
  onSave,
  onDuplicate,
  onDelete,
}: PostEditorDrawerProps) {
  const [caption, setCaption] = useState("");
  const [platform, setPlatform] = useState<SocialPlatform>("x");
  const [status, setStatus] = useState<ScheduledPostStatus>("upcoming");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [campaignId, setCampaignId] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!post) return;
    const parts = toLocalParts(post.scheduledFor);
    setCaption(post.caption);
    setPlatform(post.platform);
    setStatus(post.status);
    setDate(parts.date);
    setTime(parts.time);
    setNotes(post.notes ?? "");
    setCampaignId(post.campaignId ?? "");
    setError(null);
  }, [post]);

  if (!post) return null;

  const editingPost = post;
  const campaign = campaigns.find((item) => item.id === campaignId);

  async function handleSave() {
    setBusy(true);
    setError(null);
    try {
      await onSave(editingPost.id, {
        platform,
        caption,
        imageDataUrl: editingPost.imageDataUrl,
        imageUrl: editingPost.imageUrl,
        imageStoragePath: editingPost.imageStoragePath,
        scheduledFor: localDateTimeToIso(date, time),
        notes: notes || null,
        status,
        campaignId: campaignId || null,
        campaignColor: campaign?.color ?? editingPost.campaignColor,
      });
      onClose();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Failed to save post."
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
            aria-label="Close editor"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 24, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 34 }}
            className="relative h-full w-full max-w-md overflow-y-auto border-l border-white/10 bg-[#0a0618] p-5 shadow-2xl shadow-black/40"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-400">
                  Edit post
                </p>
                <h3 className="mt-1 text-lg font-semibold text-white">
                  {CALENDAR_STATUS_LABELS[post.status]}
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-white/10 p-2 text-zinc-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <label className="block space-y-2">
                <span className="text-xs uppercase tracking-wider text-zinc-500">
                  Caption
                </span>
                <textarea
                  value={caption}
                  onChange={(event) => setCaption(event.target.value)}
                  rows={5}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400/40"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-xs uppercase tracking-wider text-zinc-500">
                  Platform
                </span>
                <select
                  value={platform}
                  onChange={(event) =>
                    setPlatform(event.target.value as SocialPlatform)
                  }
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none"
                >
                  {AVAILABLE_PLATFORMS.map((id) => (
                    <option key={id} value={id}>
                      {PLATFORM_META[id].label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-wider text-zinc-500">
                    Date
                  </span>
                  <input
                    type="date"
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-wider text-zinc-500">
                    Time
                  </span>
                  <input
                    type="time"
                    value={time}
                    onChange={(event) => setTime(event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none"
                  />
                </label>
              </div>

              <label className="block space-y-2">
                <span className="text-xs uppercase tracking-wider text-zinc-500">
                  Status
                </span>
                <select
                  value={status}
                  onChange={(event) =>
                    setStatus(event.target.value as ScheduledPostStatus)
                  }
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none"
                >
                  {SCHEDULED_POST_STATUSES.map((item) => (
                    <option key={item} value={item}>
                      {CALENDAR_STATUS_LABELS[item]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-2">
                <span className="text-xs uppercase tracking-wider text-zinc-500">
                  Campaign
                </span>
                <select
                  value={campaignId}
                  onChange={(event) => setCampaignId(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none"
                >
                  <option value="">No campaign</option>
                  {campaigns.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-2">
                <span className="text-xs uppercase tracking-wider text-zinc-500">
                  Notes
                </span>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400/40"
                />
              </label>

              {error ? (
                <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                  {error}
                </p>
              ) : null}

              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleSave()}
                  className="flex-1 rounded-xl bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {busy ? "Saving…" : "Save changes"}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void onDuplicate(editingPost.id)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-zinc-200"
                >
                  <Copy className="h-4 w-4" />
                  Duplicate
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void onDelete(editingPost.id)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-300"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
