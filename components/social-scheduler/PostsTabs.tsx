"use client";

import { Loader2, Pencil, RefreshCw, Trash2 } from "lucide-react";
import PlatformIcon from "@/components/social-scheduler/PlatformIcon";
import { formatSchedulerDateTime } from "@/lib/social-scheduler/format";
import {
  PLATFORM_META,
  type ScheduledPost,
  type ScheduledPostStatus,
} from "@/lib/social-scheduler/types";

type PostsTabsProps = {
  activeTab: ScheduledPostStatus;
  upcoming: ScheduledPost[];
  published: ScheduledPost[];
  failed: ScheduledPost[];
  isLoading: boolean;
  deletingPostId: string | null;
  retryingPostId: string | null;
  onTabChange: (tab: ScheduledPostStatus) => void;
  onEdit: (post: ScheduledPost) => void;
  onDelete: (postId: string) => void;
  onRetry: (postId: string) => void;
};

const TABS: Array<{ id: ScheduledPostStatus; label: string }> = [
  { id: "upcoming", label: "Upcoming" },
  { id: "published", label: "Published" },
  { id: "failed", label: "Failed" },
];

function formatDate(iso: string) {
  return formatSchedulerDateTime(iso);
}

function StatusBadge({ status }: { status: ScheduledPostStatus }) {
  const className =
    status === "published"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
      : status === "failed"
        ? "border-red-500/30 bg-red-500/10 text-red-300"
        : "border-cyan-500/30 bg-cyan-500/10 text-cyan-300";

  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${className}`}
    >
      {status}
    </span>
  );
}

function PostRow({
  post,
  deletingPostId,
  retryingPostId,
  onEdit,
  onDelete,
  onRetry,
}: {
  post: ScheduledPost;
  deletingPostId: string | null;
  retryingPostId: string | null;
  onEdit: (post: ScheduledPost) => void;
  onDelete: (postId: string) => void;
  onRetry: (postId: string) => void;
}) {
  const image = post.imageUrl ?? post.imageDataUrl;

  return (
    <article className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-black/20 text-white">
            <PlatformIcon platform={post.platform} className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium text-white">
                {PLATFORM_META[post.platform].label}
              </p>
              <StatusBadge status={post.status} />
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              {post.status === "published" && post.publishedAt
                ? `Published ${formatDate(post.publishedAt)}`
                : `Scheduled ${formatDate(post.scheduledFor)}`}
            </p>
            <p className="mt-2 line-clamp-2 text-sm text-zinc-400">
              {post.caption}
            </p>
            {post.errorMessage ? (
              <p className="mt-2 text-xs text-red-300/90">{post.errorMessage}</p>
            ) : null}
          </div>
        </div>

        {image ? (
          <img
            src={image}
            alt=""
            className="h-14 w-14 rounded-lg object-cover"
          />
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {post.status !== "published" ? (
          <button
            type="button"
            onClick={() => onEdit(post)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-white/[0.08] hover:text-white"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </button>
        ) : null}
        {post.status === "failed" ? (
          <button
            type="button"
            disabled={retryingPostId === post.id}
            onClick={() => onRetry(post.id)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/10 px-2.5 py-1.5 text-xs font-medium text-amber-200 transition hover:bg-amber-500/15 disabled:cursor-wait disabled:opacity-60"
          >
            {retryingPostId === post.id ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            Retry
          </button>
        ) : null}
        <button
          type="button"
          disabled={deletingPostId === post.id}
          onClick={() => onDelete(post.id)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-2.5 py-1.5 text-xs font-medium text-red-300 transition hover:bg-red-500/15 disabled:cursor-wait disabled:opacity-60"
        >
          {deletingPostId === post.id ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
          Delete
        </button>
      </div>
    </article>
  );
}

export default function PostsTabs({
  activeTab,
  upcoming,
  published,
  failed,
  isLoading,
  deletingPostId,
  retryingPostId,
  onTabChange,
  onEdit,
  onDelete,
  onRetry,
}: PostsTabsProps) {
  const posts =
    activeTab === "upcoming"
      ? upcoming
      : activeTab === "published"
        ? published
        : failed;

  return (
    <section className="glass rounded-2xl border border-white/[0.08] p-5 shadow-xl shadow-black/10 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Posts</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Upcoming queue, published history, and failed retries.
          </p>
        </div>
        <div className="flex rounded-xl border border-white/10 bg-white/[0.03] p-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                activeTab === tab.id
                  ? "bg-white/[0.08] text-white"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="h-24 animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.03]"
            />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-5 py-10 text-center">
          <p className="text-sm font-medium text-zinc-300">No posts here yet.</p>
          <p className="mt-2 text-sm text-zinc-600">
            Compose your first post to fill this queue.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <PostRow
              key={post.id}
              post={post}
              deletingPostId={deletingPostId}
              retryingPostId={retryingPostId}
              onEdit={onEdit}
              onDelete={onDelete}
              onRetry={onRetry}
            />
          ))}
        </div>
      )}
    </section>
  );
}
