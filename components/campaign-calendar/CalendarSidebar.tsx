"use client";

import { useState } from "react";
import { Eye, Plus, Users } from "lucide-react";
import PlatformIcon from "@/components/social-scheduler/PlatformIcon";
import {
  CALENDAR_STATUS_LABELS,
  getTodaysPosts,
  getUpcomingPosts,
  resolvePostColor,
} from "@/lib/campaign-calendar/utils";
import { formatSchedulerDateTime } from "@/lib/social-scheduler/format";
import {
  CAMPAIGN_COLORS,
  type Campaign,
  type ScheduledPost,
} from "@/lib/social-scheduler/types";

type CalendarSidebarProps = {
  posts: ScheduledPost[];
  campaigns: Campaign[];
  onSelectPost: (post: ScheduledPost) => void;
  onCreateCampaign: (input: {
    name: string;
    color: string;
    visibility: "private" | "team";
  }) => Promise<void>;
};

export default function CalendarSidebar({
  posts,
  campaigns,
  onSelectPost,
  onCreateCampaign,
}: CalendarSidebarProps) {
  const todays = getTodaysPosts(posts);
  const upcoming = getUpcomingPosts(posts);
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(CAMPAIGN_COLORS[0]);
  const [visibility, setVisibility] = useState<"private" | "team">("private");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await onCreateCampaign({
        name: name.trim(),
        color,
        visibility,
      });
      setName("");
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Failed to create campaign."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <aside className="space-y-4">
      <section className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
        <h3 className="text-sm font-semibold text-white">Today</h3>
        <div className="mt-3 space-y-2">
          {todays.length === 0 ? (
            <p className="text-sm text-zinc-500">No posts scheduled today.</p>
          ) : (
            todays.map((post) => (
              <button
                key={post.id}
                type="button"
                onClick={() => onSelectPost(post)}
                className="flex w-full items-start gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-left transition hover:border-white/20"
              >
                <span
                  className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{
                    backgroundColor: resolvePostColor(
                      post,
                      campaigns.find((c) => c.id === post.campaignId)?.color
                    ),
                  }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <PlatformIcon platform={post.platform} className="h-3 w-3" />
                    <span className="truncate text-xs text-zinc-200">
                      {post.caption}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-zinc-500">
                    {formatSchedulerDateTime(post.scheduledFor)} ·{" "}
                    {CALENDAR_STATUS_LABELS[post.status]}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
        <h3 className="text-sm font-semibold text-white">Upcoming</h3>
        <div className="mt-3 space-y-2">
          {upcoming.length === 0 ? (
            <p className="text-sm text-zinc-500">Nothing upcoming.</p>
          ) : (
            upcoming.map((post) => (
              <button
                key={post.id}
                type="button"
                onClick={() => onSelectPost(post)}
                className="flex w-full items-start gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-left transition hover:border-white/20"
              >
                <PlatformIcon platform={post.platform} className="mt-0.5 h-3.5 w-3.5" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs text-zinc-200">{post.caption}</p>
                  <p className="mt-1 text-[11px] text-zinc-500">
                    {formatSchedulerDateTime(post.scheduledFor)}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-white">Campaigns</h3>
          <Users className="h-4 w-4 text-zinc-500" />
        </div>
        <div className="mt-3 space-y-2">
          {campaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2"
            >
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: campaign.color }}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-zinc-200">
                  {campaign.name}
                </p>
                <p className="text-[11px] text-zinc-500">
                  {campaign.visibility === "team" ? (
                    <span className="inline-flex items-center gap-1">
                      <Eye className="h-3 w-3" /> Team visible
                    </span>
                  ) : (
                    "Private"
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-2 border-t border-white/[0.06] pt-4">
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="New campaign name"
            className="w-full rounded-xl border border-white/10 bg-[#0a0618] px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/40"
          />
          <div className="flex flex-wrap gap-2">
            {CAMPAIGN_COLORS.map((swatch) => (
              <button
                key={swatch}
                type="button"
                onClick={() => setColor(swatch)}
                className={`h-6 w-6 rounded-full border ${
                  color === swatch ? "border-white" : "border-transparent"
                }`}
                style={{ backgroundColor: swatch }}
                aria-label={`Color ${swatch}`}
              />
            ))}
          </div>
          <select
            value={visibility}
            onChange={(event) =>
              setVisibility(event.target.value as "private" | "team")
            }
            className="w-full rounded-xl border border-white/10 bg-[#0a0618] px-3 py-2 text-sm text-white outline-none"
          >
            <option value="private">Private</option>
            <option value="team">Team visibility</option>
          </select>
          <button
            type="button"
            disabled={saving || !name.trim()}
            onClick={() => void handleCreate()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-sm font-medium text-cyan-200 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            {saving ? "Saving…" : "Create campaign"}
          </button>
          {error ? <p className="text-xs text-red-400">{error}</p> : null}
        </div>
      </section>
    </aside>
  );
}
