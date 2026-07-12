"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import CalendarView from "@/components/social-scheduler/CalendarView";
import ComposePanel, {
  createDefaultComposeForm,
  EMPTY_COMPOSE_FORM,
  scheduledForIsoFromForm,
  scheduledLabelFromForm,
  type ComposeFormState,
} from "@/components/social-scheduler/ComposePanel";
import PlatformCards from "@/components/social-scheduler/PlatformCards";
import OAuthSetupCard from "@/components/social-scheduler/OAuthSetupCard";
import PostsTabs from "@/components/social-scheduler/PostsTabs";
import {
  isoToLocalDateInput,
  isoToLocalTimeInput,
} from "@/lib/social-scheduler/format";
import {
  isAnyPlatformOAuthConfigured,
  isPlatformOAuthConfigured,
  type SocialOAuthStatus,
} from "@/lib/social-scheduler/oauth-config";
import { useSchedulerHydrated } from "@/lib/social-scheduler/use-scheduler-hydrated";
import { groupPostsByStatus } from "@/lib/social-scheduler/server";
import {
  isAvailablePlatform,
  type ScheduledPost,
  ScheduledPostsSummary,
  SocialConnection,
  SocialPlatform,
  ScheduledPostStatus,
} from "@/lib/social-scheduler/types";

type Status = { type: "success" | "error"; message: string } | null;

type SchedulerApiResponse = {
  posts?: ScheduledPost[];
  summary?: ScheduledPostsSummary;
  connections?: SocialConnection[];
  oauth?: SocialOAuthStatus;
  error?: string;
  post?: ScheduledPost;
};

type SocialSchedulerPageClientProps = {
  oauthStatus: SocialOAuthStatus;
};

const emptySummary: ScheduledPostsSummary = {
  upcoming: 0,
  published: 0,
  failed: 0,
};

function formFromPost(post: ScheduledPost): ComposeFormState {
  return {
    platform: post.platform,
    caption: post.caption,
    imageUrl: post.imageUrl ?? post.imageDataUrl,
    imageStoragePath: post.imageStoragePath,
    date: isoToLocalDateInput(post.scheduledFor),
    time: isoToLocalTimeInput(post.scheduledFor),
    notes: post.notes ?? "",
  };
}

export default function SocialSchedulerPageClient({
  oauthStatus,
}: SocialSchedulerPageClientProps) {
  const searchParams = useSearchParams();
  const hydrated = useSchedulerHydrated();
  const [connections, setConnections] = useState<SocialConnection[]>([]);
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [summary, setSummary] = useState<ScheduledPostsSummary>(emptySummary);
  const [form, setForm] = useState<ComposeFormState>(EMPTY_COMPOSE_FORM);
  const [activeTab, setActiveTab] = useState<ScheduledPostStatus>("upcoming");
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [retryingPostId, setRetryingPostId] = useState<string | null>(null);
  const [connectingPlatform, setConnectingPlatform] =
    useState<SocialPlatform | null>(null);
  const [disconnectingPlatform, setDisconnectingPlatform] =
    useState<SocialPlatform | null>(null);

  const groupedPosts = useMemo(() => groupPostsByStatus(posts), [posts]);

  const loadConnections = useCallback(async () => {
    try {
      const response = await fetch("/api/social-connections", {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      const payload = (await response.json()) as SchedulerApiResponse;
      setConnections(payload.connections ?? []);
    } catch {
      setConnections([]);
    }
  }, []);

  const loadPosts = useCallback(async () => {
    const response = await fetch("/api/scheduled-posts", {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    const payload = (await response.json()) as SchedulerApiResponse;

    if (!response.ok) {
      throw new Error(payload.error ?? "Unable to load scheduled posts.");
    }

    setPosts(payload.posts ?? []);
    setSummary(payload.summary ?? emptySummary);
  }, []);

  const refreshAll = useCallback(async () => {
    setIsLoading(true);
    try {
      await loadConnections();
      await loadPosts();
    } catch {
      setStatus({
        type: "error",
        message: "We couldn't refresh your posts. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [loadConnections, loadPosts]);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    if (!hydrated || editingPostId) {
      return;
    }

    setForm((current) =>
      current.date && current.time ? current : createDefaultComposeForm()
    );
  }, [hydrated, editingPostId]);

  useEffect(() => {
    const connectionStatus = searchParams.get("connection");

    if (connectionStatus === "success") {
      setStatus({
        type: "success",
        message: "Account connected successfully.",
      });
    } else if (connectionStatus === "error") {
      const message = searchParams.get("message");
      setStatus({
        type: "error",
        message:
          message ?? "We couldn't connect your account. Please try again.",
      });
    }
  }, [searchParams]);

  function updateForm<K extends keyof ComposeFormState>(
    key: K,
    value: ComposeFormState[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function resetForm() {
    setForm(createDefaultComposeForm());
    setEditingPostId(null);
  }

  async function handleImageUpload(file: File) {
    setIsUploadingImage(true);
    setStatus(null);

    try {
      const body = new FormData();
      body.append("file", file);

      const response = await fetch("/api/scheduled-posts/upload-image", {
        method: "POST",
        body,
      });
      const payload = (await response.json()) as {
        imageUrl?: string;
        imageStoragePath?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to upload image.");
      }

      updateForm("imageUrl", payload.imageUrl ?? null);
      updateForm("imageStoragePath", payload.imageStoragePath ?? null);
    } catch {
      setStatus({
        type: "error",
        message: "We couldn't upload your image. Please try again.",
      });
    } finally {
      setIsUploadingImage(false);
    }
  }

  async function savePost(publishNow: boolean) {
    setStatus(null);
    setIsSaving(true);

    const payload = {
      platform: form.platform,
      caption: form.caption,
      imageDataUrl: null,
      imageUrl: form.imageUrl,
      imageStoragePath: form.imageStoragePath,
      scheduledFor: publishNow
        ? new Date().toISOString()
        : scheduledForIsoFromForm(form),
      notes: form.notes,
      status: editingPostId
        ? posts.find((post) => post.id === editingPostId)?.status ?? "upcoming"
        : "upcoming",
      publishNow: !editingPostId && publishNow,
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
        throw new Error(responsePayload.error ?? "Unable to save post.");
      }

      if (editingPostId && publishNow) {
        const publishResponse = await fetch(
          `/api/scheduled-posts/${editingPostId}/publish`,
          { method: "POST" }
        );
        const publishPayload = (await publishResponse.json()) as SchedulerApiResponse;
        if (!publishResponse.ok) {
          throw new Error(publishPayload.error ?? "Unable to publish post.");
        }
      }

      setStatus({
        type: "success",
        message: publishNow
          ? "Post published successfully."
          : editingPostId
            ? "Scheduled post updated."
            : "Post scheduled successfully.",
      });
      resetForm();
      await loadPosts();
    } catch {
      setStatus({
        type: "error",
        message: "We couldn't save your post. Please try again.",
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
        throw new Error(payload.error ?? "Unable to delete post.");
      }

      setStatus({ type: "success", message: "Post deleted." });
      if (editingPostId === postId) {
        resetForm();
      }
      await loadPosts();
    } catch {
      setStatus({
        type: "error",
        message: "We couldn't delete this post. Please try again.",
      });
    } finally {
      setDeletingPostId(null);
    }
  }

  async function handleRetry(postId: string) {
    setRetryingPostId(postId);
    setStatus(null);

    try {
      const response = await fetch(`/api/scheduled-posts/${postId}/retry`, {
        method: "POST",
      });
      const payload = (await response.json()) as SchedulerApiResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to retry post.");
      }

      setStatus({
        type: "success",
        message:
          payload.post?.status === "published"
            ? "Post published successfully."
            : "Retry attempted. Check failed posts if needed.",
      });
      await loadPosts();
    } catch {
      setStatus({
        type: "error",
        message: "We couldn't retry this post. Please try again.",
      });
    } finally {
      setRetryingPostId(null);
    }
  }

  function handleConnect(platform: SocialPlatform) {
    if (
      !isAvailablePlatform(platform) ||
      !isPlatformOAuthConfigured(platform, oauthStatus)
    ) {
      return;
    }

    setConnectingPlatform(platform);
    window.location.href = `/api/social-connections/${platform}/authorize?returnTo=${encodeURIComponent("/dashboard/social-scheduler")}`;
  }

  async function handleDisconnect(platform: SocialPlatform) {
    setDisconnectingPlatform(platform);
    setStatus(null);

    try {
      const response = await fetch(`/api/social-connections/${platform}`, {
        method: "DELETE",
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to disconnect account.");
      }

      setStatus({ type: "success", message: "Account disconnected." });
      await loadConnections();
    } catch {
      setStatus({
        type: "error",
        message: "We couldn't disconnect this account. Please try again.",
      });
    } finally {
      setDisconnectingPlatform(null);
    }
  }

  const oauthConfigured = isAnyPlatformOAuthConfigured(oauthStatus);

  return (
    <div className="space-y-8">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="glass relative overflow-hidden rounded-3xl border border-white/[0.08] p-5 shadow-2xl shadow-black/20 sm:p-8"
      >
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-cyan-500/15 blur-3xl" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1 text-xs font-medium text-violet-200">
              AI Marketing OS
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-4xl">
              Social Scheduler
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-zinc-400 sm:text-base">
              Connect accounts, compose posts, schedule campaigns, and publish to
              X and LinkedIn from one premium workspace.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:min-w-80">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                Upcoming
              </p>
              <p className="mt-2 text-2xl font-semibold text-cyan-300">
                {summary.upcoming}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                Published
              </p>
              <p className="mt-2 text-2xl font-semibold text-emerald-300">
                {summary.published}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                Failed
              </p>
              <p className="mt-2 text-2xl font-semibold text-red-300">
                {summary.failed}
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      {!oauthConfigured ? <OAuthSetupCard /> : null}

      {status ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            status.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
              : "border-red-500/30 bg-red-500/10 text-red-200"
          }`}
          role={status.type === "success" ? "status" : "alert"}
        >
          {status.message}
        </div>
      ) : null}

      <PlatformCards
        connections={connections}
        oauthStatus={oauthStatus}
        connectingPlatform={connectingPlatform}
        disconnectingPlatform={disconnectingPlatform}
        onConnect={handleConnect}
        onDisconnect={(platform) => void handleDisconnect(platform)}
      />

      <ComposePanel
        form={form}
        connections={connections}
        editingPostId={editingPostId}
        isSaving={isSaving}
        isUploadingImage={isUploadingImage}
        onChange={updateForm}
        onImageUpload={handleImageUpload}
        onRemoveImage={() => {
          updateForm("imageUrl", null);
          updateForm("imageStoragePath", null);
        }}
        onSubmitSchedule={() => savePost(false)}
        onSubmitPublishNow={() => savePost(true)}
        onCancelEdit={resetForm}
      />

      <PostsTabs
        activeTab={activeTab}
        upcoming={groupedPosts.upcoming}
        published={groupedPosts.published}
        failed={groupedPosts.failed}
        isLoading={isLoading}
        deletingPostId={deletingPostId}
        retryingPostId={retryingPostId}
        onTabChange={setActiveTab}
        onEdit={(post) => {
          setEditingPostId(post.id);
          setForm(formFromPost(post));
          setStatus(null);
        }}
        onDelete={(postId) => void handleDelete(postId)}
        onRetry={(postId) => void handleRetry(postId)}
      />

      <CalendarView posts={posts} />

      {hydrated && form.date ? (
        <p className="text-center text-xs text-zinc-600">
          Scheduled posts publish automatically via Advora&apos;s publishing worker.
          Next preview: {scheduledLabelFromForm(form)}
        </p>
      ) : (
        <p className="text-center text-xs text-zinc-600">
          Scheduled posts publish automatically via Advora&apos;s publishing worker.
        </p>
      )}
    </div>
  );
}
