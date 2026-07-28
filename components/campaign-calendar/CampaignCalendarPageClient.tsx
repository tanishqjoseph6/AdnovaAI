"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { motion } from "framer-motion";
import { CalendarRange } from "lucide-react";
import CalendarSkeleton from "@/components/campaign-calendar/CalendarSkeleton";
import CalendarSidebar from "@/components/campaign-calendar/CalendarSidebar";
import CalendarToolbar from "@/components/campaign-calendar/CalendarToolbar";
import DayCalendar from "@/components/campaign-calendar/DayCalendar";
import MonthCalendar from "@/components/campaign-calendar/MonthCalendar";
import PostEditorDrawer from "@/components/campaign-calendar/PostEditorDrawer";
import WeekCalendar from "@/components/campaign-calendar/WeekCalendar";
import PlatformIcon from "@/components/social-scheduler/PlatformIcon";
import {
  createCampaign,
  deleteScheduledPost,
  duplicatePost,
  fetchCampaigns,
  fetchScheduledPosts,
  reschedulePost,
  updateScheduledPost,
} from "@/lib/api/campaign-calendar-client";
import {
  dayKey,
  filterCalendarPosts,
  parseDayDropId,
  preserveTimeOnDate,
  startOfDay,
  type CalendarViewMode,
} from "@/lib/campaign-calendar/utils";
import { createClient } from "@/lib/supabase/client";
import type {
  Campaign,
  ScheduledPost,
  ScheduledPostStatus,
  SocialPlatform,
} from "@/lib/social-scheduler/types";

export default function CampaignCalendarPageClient() {
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [view, setView] = useState<CalendarViewMode>("month");
  const [anchor, setAnchor] = useState(() => startOfDay(new Date()));
  const [search, setSearch] = useState("");
  const [platforms, setPlatforms] = useState<SocialPlatform[]>([]);
  const [statuses, setStatuses] = useState<ScheduledPostStatus[]>([]);
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<ScheduledPost | null>(null);
  const [activeDragPost, setActiveDragPost] = useState<ScheduledPost | null>(
    null
  );
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  const refresh = useCallback(async () => {
    const [nextPosts, nextCampaigns] = await Promise.all([
      fetchScheduledPosts(),
      fetchCampaigns(),
    ]);
    setPosts(nextPosts);
    setCampaigns(nextCampaigns);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await refresh();
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load calendar."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("campaign-calendar-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "scheduled_posts" },
        () => {
          void refresh().catch(() => undefined);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "campaigns" },
        () => {
          void refresh().catch(() => undefined);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [refresh]);

  const filteredPosts = useMemo(
    () =>
      filterCalendarPosts(posts, {
        search,
        platforms,
        statuses,
        campaignId,
      }),
    [posts, search, platforms, statuses, campaignId]
  );

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2400);
  }

  function goToday() {
    setAnchor(startOfDay(new Date()));
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveDragPost(null);
    const { active, over } = event;
    if (!over) return;

    const overId = String(over.id);
    const targetDate = parseDayDropId(overId);
    if (!targetDate) return;

    const postId = String(active.id);
    const post = posts.find((item) => item.id === postId);
    if (!post || post.status === "published") return;

    const currentKey = dayKey(new Date(post.scheduledFor));
    const targetKey = dayKey(targetDate);
    if (currentKey === targetKey) return;

    const nextIso = preserveTimeOnDate(post.scheduledFor, targetDate);
    const previous = posts;
    setPosts((current) =>
      current.map((item) =>
        item.id === postId
          ? {
              ...item,
              scheduledFor: nextIso,
              status: item.status === "failed" ? "upcoming" : item.status,
            }
          : item
      )
    );

    try {
      const updated = await reschedulePost(postId, nextIso);
      setPosts((current) =>
        current.map((item) => (item.id === updated.id ? updated : item))
      );
      showToast("Post rescheduled.");
    } catch (rescheduleError) {
      setPosts(previous);
      setError(
        rescheduleError instanceof Error
          ? rescheduleError.message
          : "Failed to reschedule."
      );
    }
  }

  async function handleCreateAt(date: Date) {
    const scheduledFor = new Date(date);
    scheduledFor.setHours(10, 0, 0, 0);
    try {
      const response = await fetch("/api/scheduled-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: "x",
          caption: "New draft post — edit me",
          scheduledFor: scheduledFor.toISOString(),
          status: "draft",
          notes: null,
          imageDataUrl: null,
          imageUrl: null,
          imageStoragePath: null,
          campaignId,
          campaignColor:
            campaigns.find((item) => item.id === campaignId)?.color ?? null,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.post) {
        throw new Error(
          typeof payload.error === "string"
            ? payload.error
            : "Failed to create draft."
        );
      }
      setPosts((current) => [payload.post as ScheduledPost, ...current]);
      setSelectedPost(payload.post as ScheduledPost);
      showToast("Draft created.");
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Failed to create draft."
      );
    }
  }

  if (loading) {
    return <CalendarSkeleton />;
  }

  return (
    <div className="space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-violet-600/15 via-[#0a0618] to-cyan-600/10 p-5 sm:p-6"
      >
        <div className="pointer-events-none absolute -right-10 top-0 h-40 w-40 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="relative flex flex-wrap items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
            <CalendarRange className="h-5 w-5 text-cyan-300" />
          </span>
          <div>
            <h2 className="text-xl font-semibold text-white">Campaign Calendar</h2>
            <p className="text-sm text-zinc-400">
              Plan, drag, reschedule, and sync posts across platforms in real time.
            </p>
          </div>
        </div>
      </motion.section>

      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
        >
          {error}
        </div>
      ) : null}

      {toast ? (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {toast}
        </div>
      ) : null}

      <CalendarToolbar
        view={view}
        search={search}
        platforms={platforms}
        statuses={statuses}
        campaignId={campaignId}
        campaigns={campaigns}
        onViewChange={setView}
        onSearchChange={setSearch}
        onTogglePlatform={(platform) =>
          setPlatforms((current) =>
            current.includes(platform)
              ? current.filter((item) => item !== platform)
              : [...current, platform]
          )
        }
        onToggleStatus={(status) =>
          setStatuses((current) =>
            current.includes(status)
              ? current.filter((item) => item !== status)
              : [...current, status]
          )
        }
        onCampaignChange={setCampaignId}
        onToday={goToday}
      />

      <DndContext
        sensors={sensors}
        onDragStart={(event) => {
          const post = posts.find((item) => item.id === String(event.active.id));
          setActiveDragPost(post ?? null);
        }}
        onDragEnd={(event) => void handleDragEnd(event)}
        onDragCancel={() => setActiveDragPost(null)}
      >
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div>
            {view === "month" ? (
              <MonthCalendar
                month={new Date(anchor.getFullYear(), anchor.getMonth(), 1)}
                posts={filteredPosts}
                campaigns={campaigns}
                onMonthChange={(month) => setAnchor(startOfDay(month))}
                onSelectPost={setSelectedPost}
                onCreateAt={(date) => void handleCreateAt(date)}
              />
            ) : null}
            {view === "week" ? (
              <WeekCalendar
                anchor={anchor}
                posts={filteredPosts}
                campaigns={campaigns}
                onAnchorChange={setAnchor}
                onSelectPost={setSelectedPost}
                onCreateAt={(date) => void handleCreateAt(date)}
              />
            ) : null}
            {view === "day" ? (
              <DayCalendar
                day={anchor}
                posts={filteredPosts}
                campaigns={campaigns}
                onDayChange={setAnchor}
                onSelectPost={setSelectedPost}
                onCreateAt={(date) => void handleCreateAt(date)}
              />
            ) : null}

            {filteredPosts.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-white/10 p-8 text-center">
                <p className="text-sm text-zinc-400">
                  No posts match your filters. Create a draft from any day cell.
                </p>
              </div>
            ) : null}
          </div>

          <CalendarSidebar
            posts={filteredPosts}
            campaigns={campaigns}
            onSelectPost={setSelectedPost}
            onCreateCampaign={async (input) => {
              const campaign = await createCampaign(input);
              setCampaigns((current) => [campaign, ...current]);
              showToast("Campaign created.");
            }}
          />
        </div>

        <DragOverlay>
          {activeDragPost ? (
            <div className="rounded-lg border border-cyan-400/40 bg-[#0a0618] px-3 py-2 shadow-xl shadow-violet-500/20">
              <div className="flex items-center gap-2">
                <PlatformIcon
                  platform={activeDragPost.platform}
                  className="h-3.5 w-3.5"
                />
                <span className="max-w-[220px] truncate text-xs text-white">
                  {activeDragPost.caption}
                </span>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <PostEditorDrawer
        post={selectedPost}
        campaigns={campaigns}
        open={Boolean(selectedPost)}
        onClose={() => setSelectedPost(null)}
        onSave={async (postId, body) => {
          const updated = await updateScheduledPost(postId, body);
          setPosts((current) =>
            current.map((item) => (item.id === updated.id ? updated : item))
          );
          showToast("Post updated.");
        }}
        onDuplicate={async (postId) => {
          const created = await duplicatePost(postId);
          setPosts((current) => [created, ...current]);
          setSelectedPost(created);
          showToast("Post duplicated.");
        }}
        onDelete={async (postId) => {
          await deleteScheduledPost(postId);
          setPosts((current) => current.filter((item) => item.id !== postId));
          setSelectedPost(null);
          showToast("Post deleted.");
        }}
      />
    </div>
  );
}
