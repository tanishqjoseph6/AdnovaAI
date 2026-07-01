"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CalendarClock, Loader2, Pencil, Trash2, Upload } from "lucide-react";
import {
  PLATFORM_DESCRIPTIONS,
  PLATFORM_LABELS,
  SOCIAL_PLATFORMS,
  type ScheduledPost,
  type ScheduledPostsSummary,
  type SocialPlatform,
} from "@/lib/social-scheduler/types";
import {
  settingsInputClassName,
  settingsLabelClassName,
  settingsSelectClassName,
} from "@/lib/settings/display";

type Status = { type: "success" | "error"; message: string } | null;

type SchedulerApiResponse = {
  posts?: ScheduledPost[];
  summary?: ScheduledPostsSummary;
  error?: string;
  post?: ScheduledPost;
};

type SchedulerFormState = {
  platform: SocialPlatform;
  caption: string;
  imageDataUrl: string | null;
  date: string;
  time: string;
  notes: string;
};

const textareaClassName = `${settingsInputClassName} min-h-32 resize-y`;
const emptySummary: ScheduledPostsSummary = {
  upcoming: 0,
  published: 0,
  failed: 0,
};

function todayDateValue() {
  return new Date().toISOString().slice(0, 10);
}

function nextHourValue() {
  const date = new Date();
  date.setHours(date.getHours() + 1, 0, 0, 0);
  return date.toTimeString().slice(0, 5);
}

function createDefaultForm(): SchedulerFormState {
  return {
    platform: "instagram",
    caption: "",
    imageDataUrl: null,
    date: todayDateValue(),
    time: nextHourValue(),
    notes: "",
  };
}

function toLocalDateValue(iso: string) {
  const date = new Date(iso);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function toLocalTimeValue(iso: string) {
  return new Date(iso).toTimeString().slice(0, 5);
}

function formFromPost(post: ScheduledPost): SchedulerFormState {
  return {
    platform: post.platform,
    caption: post.caption,
    imageDataUrl: post.imageDataUrl,
    date: toLocalDateValue(post.scheduledFor),
    time: toLocalTimeValue(post.scheduledFor),
    notes: post.notes ?? "",
  };
}

function scheduledForIso(form: SchedulerFormState) {
  return new Date(`${form.date}T${form.time || "00:00"}`).toISOString();
}

function captionPreview(caption: string) {
  return caption.length > 88 ? `${caption.slice(0, 88)}...` : caption;
}

function formatScheduledDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function StatusBadge({ status }: { status: ScheduledPost["status"] }) {
  const className =
    status === "published"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
      : status === "failed"
        ? "border-red-500/30 bg-red-500/10 text-red-300"
        : "border-cyan-500/30 bg-cyan-500/10 text-cyan-300";

  return (
    <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${className}`}>
      {status}
    </span>
  );
}

export default function SocialSchedulerPageClient() {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [summary, setSummary] = useState<ScheduledPostsSummary>(emptySummary);
  const [form, setForm] = useState<SchedulerFormState>(() => createDefaultForm());
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);

  const editingPost = useMemo(
    () => posts.find((post) => post.id === editingPostId) ?? null,
    [editingPostId, posts]
  );

  async function loadPosts() {
    setIsLoading(true);
    try {
      const response = await fetch("/api/scheduled-posts", {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      const payload = (await response.json()) as SchedulerApiResponse;

      if (!response.ok) {
        setStatus({
          type: "error",
          message: payload.error ?? "Unable to load scheduled posts.",
        });
        return;
      }

      setPosts(payload.posts ?? []);
      setSummary(payload.summary ?? emptySummary);
    } catch {
      setStatus({
        type: "error",
        message: "Unable to load scheduled posts.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadPosts();
  }, []);

  function update<K extends keyof SchedulerFormState>(
    key: K,
    value: SchedulerFormState[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/") || file.size > 750_000) {
      setStatus({
        type: "error",
        message: "Upload an image under 750 KB for Phase 1 storage.",
      });
      return;
    }

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(new Error("Image upload failed"));
      reader.readAsDataURL(file);
    });

    update("imageDataUrl", dataUrl);
  }

  function resetForm() {
    setForm(createDefaultForm());
    setEditingPostId(null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus(null);
    setIsSaving(true);

    const payload = {
      platform: form.platform,
      caption: form.caption,
      imageDataUrl: form.imageDataUrl,
      scheduledFor: scheduledForIso(form),
      notes: form.notes,
      status: editingPost?.status ?? "upcoming",
    };

    try {
      const response = await fetch(
        editingPostId
          ? `/api/scheduled-posts/${editingPostId}`
          : "/api/scheduled-posts",
        {
          method: editingPostId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const responsePayload = (await response.json()) as SchedulerApiResponse;

      if (!response.ok) {
        setStatus({
          type: "error",
          message: responsePayload.error ?? "Unable to save scheduled post.",
        });
        return;
      }

      setStatus({
        type: "success",
        message: editingPostId
          ? "Scheduled post updated."
          : "Post saved to your scheduler.",
      });
      resetForm();
      await loadPosts();
    } catch {
      setStatus({
        type: "error",
        message: "Unable to save scheduled post.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(postId: string) {
    setDeletingPostId(postId);
    setStatus(null);

    try {
      const response = await fetch(`/api/scheduled-posts/${postId}`, {
        method: "DELETE",
      });
      const payload = (await response.json()) as SchedulerApiResponse;

      if (!response.ok) {
        setStatus({
          type: "error",
          message: payload.error ?? "Unable to delete scheduled post.",
        });
        return;
      }

      setStatus({ type: "success", message: "Scheduled post deleted." });
      if (editingPostId === postId) {
        resetForm();
      }
      await loadPosts();
    } catch {
      setStatus({
        type: "error",
        message: "Unable to delete scheduled post.",
      });
    } finally {
      setDeletingPostId(null);
    }
  }

  return (
    <div className="space-y-8">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="glass relative overflow-hidden rounded-3xl border border-white/[0.08] p-5 shadow-2xl shadow-black/20 sm:p-8"
      >
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-4 inline-flex rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1 text-xs font-medium text-violet-200">
              Phase 1 Scheduler
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-4xl">
              Plan social posts before publishing integrations arrive.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-zinc-400 sm:text-base">
              Store captions, images, schedule times, and notes in Advora. Meta,
              LinkedIn, and X publishing connections are marked Coming Soon for
              the next phase.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:min-w-80">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Upcoming</p>
              <p className="mt-2 text-2xl font-semibold text-cyan-300">{summary.upcoming}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Published</p>
              <p className="mt-2 text-2xl font-semibold text-emerald-300">{summary.published}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Failed</p>
              <p className="mt-2 text-2xl font-semibold text-red-300">{summary.failed}</p>
            </div>
          </div>
        </div>
      </motion.section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {SOCIAL_PLATFORMS.map((platform) => (
          <div
            key={platform}
            className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 shadow-xl shadow-black/10"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-white">
                  {PLATFORM_LABELS[platform]}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                  {PLATFORM_DESCRIPTIONS[platform]}
                </p>
              </div>
              <span className="shrink-0 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-200">
                Coming Soon
              </span>
            </div>
          </div>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <form
          onSubmit={(event) => void handleSubmit(event)}
          className="glass rounded-2xl border border-white/[0.08] p-5 shadow-xl shadow-black/10 sm:p-6"
        >
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">
                {editingPostId ? "Edit scheduled post" : "Schedule a post"}
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                Saved locally in Supabase. Publishing APIs are not connected yet.
              </p>
            </div>
            {editingPostId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-sm font-medium text-zinc-400 transition hover:text-white"
              >
                Cancel edit
              </button>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className={settingsLabelClassName} htmlFor="scheduler-platform">
                Platform
              </label>
              <select
                id="scheduler-platform"
                value={form.platform}
                onChange={(event) =>
                  update("platform", event.target.value as SocialPlatform)
                }
                className={settingsSelectClassName}
              >
                {SOCIAL_PLATFORMS.map((platform) => (
                  <option key={platform} value={platform}>
                    {PLATFORM_LABELS[platform]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={settingsLabelClassName} htmlFor="scheduler-caption">
                Caption
              </label>
              <textarea
                id="scheduler-caption"
                value={form.caption}
                onChange={(event) => update("caption", event.target.value)}
                placeholder="Write or paste the caption you want to schedule..."
                maxLength={2200}
                className={textareaClassName}
              />
              <p className="mt-1 text-xs text-zinc-600">
                {form.caption.length}/2200 characters
              </p>
            </div>

            <div>
              <label className={settingsLabelClassName} htmlFor="scheduler-image">
                Image upload
              </label>
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-6 text-center transition hover:border-cyan-400/30 hover:bg-cyan-400/[0.04]">
                <Upload className="h-5 w-5 text-cyan-300" />
                <span className="mt-2 text-sm font-medium text-zinc-300">
                  Upload image
                </span>
                <span className="mt-1 text-xs text-zinc-600">
                  Phase 1 stores images locally as upload previews.
                </span>
                <input
                  id="scheduler-image"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(event) => void handleImageUpload(event)}
                />
              </label>
              {form.imageDataUrl && (
                <div className="mt-3 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <img
                    src={form.imageDataUrl}
                    alt="Scheduled post preview"
                    className="h-14 w-14 rounded-lg object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => update("imageDataUrl", null)}
                    className="text-xs font-medium text-red-300 transition hover:text-red-200"
                  >
                    Remove image
                  </button>
                </div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={settingsLabelClassName} htmlFor="scheduler-date">
                  Date
                </label>
                <input
                  id="scheduler-date"
                  type="date"
                  value={form.date}
                  onChange={(event) => update("date", event.target.value)}
                  className={settingsInputClassName}
                />
              </div>
              <div>
                <label className={settingsLabelClassName} htmlFor="scheduler-time">
                  Time
                </label>
                <input
                  id="scheduler-time"
                  type="time"
                  value={form.time}
                  onChange={(event) => update("time", event.target.value)}
                  className={settingsInputClassName}
                />
              </div>
            </div>

            <div>
              <label className={settingsLabelClassName} htmlFor="scheduler-notes">
                Optional notes
              </label>
              <textarea
                id="scheduler-notes"
                value={form.notes}
                onChange={(event) => update("notes", event.target.value)}
                placeholder="Campaign context, audience reminder, or approval notes..."
                maxLength={1000}
                className={`${settingsInputClassName} min-h-24 resize-y`}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-violet-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-950/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarClock className="h-4 w-4" />}
            {editingPostId ? "Update Post" : "Schedule Post"}
          </button>

          {status && (
            <div
              className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
                status.type === "success"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                  : "border-red-500/30 bg-red-500/10 text-red-200"
              }`}
              role={status.type === "success" ? "status" : "alert"}
            >
              {status.message}
            </div>
          )}
        </form>

        <section className="glass rounded-2xl border border-white/[0.08] p-5 shadow-xl shadow-black/10 sm:p-6">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-white">Scheduled Posts</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Review saved posts and update drafts before publishing integrations go live.
            </p>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((item) => (
                <div
                  key={item}
                  className="h-20 animate-pulse rounded-xl border border-white/[0.06] bg-white/[0.03]"
                />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-5 py-10 text-center">
              <p className="text-sm font-medium text-zinc-300">
                No scheduled posts yet.
              </p>
              <p className="mt-2 text-sm text-zinc-600">
                Add your first post with the scheduler form.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-white/[0.08]">
              <div className="hidden grid-cols-[0.8fr_0.8fr_1fr_1.5fr_0.8fr] gap-3 border-b border-white/[0.08] bg-white/[0.03] px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 md:grid">
                <span>Platform</span>
                <span>Status</span>
                <span>Date & Time</span>
                <span>Caption Preview</span>
                <span className="text-right">Actions</span>
              </div>
              <div className="divide-y divide-white/[0.06]">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    className="grid gap-3 px-4 py-4 text-sm md:grid-cols-[0.8fr_0.8fr_1fr_1.5fr_0.8fr] md:items-center"
                  >
                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] text-zinc-600 md:hidden">
                        Platform
                      </p>
                      <p className="font-medium text-white">
                        {PLATFORM_LABELS[post.platform]}
                      </p>
                    </div>
                    <div>
                      <p className="mb-1 text-xs uppercase tracking-[0.14em] text-zinc-600 md:hidden">
                        Status
                      </p>
                      <StatusBadge status={post.status} />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] text-zinc-600 md:hidden">
                        Date & Time
                      </p>
                      <p className="text-zinc-300">
                        {formatScheduledDate(post.scheduledFor)}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.14em] text-zinc-600 md:hidden">
                        Caption Preview
                      </p>
                      <p className="break-words text-zinc-400">
                        {captionPreview(post.caption)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 md:justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPostId(post.id);
                          setForm(formFromPost(post));
                          setStatus(null);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={deletingPostId === post.id}
                        onClick={() => void handleDelete(post.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-2.5 py-1.5 text-xs font-medium text-red-300 transition hover:border-red-400/30 hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {deletingPostId === post.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
