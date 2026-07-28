"use client";

import {
  CalendarDays,
  Filter,
  Search,
} from "lucide-react";
import type { CalendarViewMode } from "@/lib/campaign-calendar/utils";
import {
  SCHEDULED_POST_STATUSES,
  SOCIAL_PLATFORMS,
  PLATFORM_META,
  type Campaign,
  type ScheduledPostStatus,
  type SocialPlatform,
} from "@/lib/social-scheduler/types";
import { CALENDAR_STATUS_LABELS } from "@/lib/campaign-calendar/utils";

type CalendarToolbarProps = {
  view: CalendarViewMode;
  search: string;
  platforms: SocialPlatform[];
  statuses: ScheduledPostStatus[];
  campaignId: string | null;
  campaigns: Campaign[];
  onViewChange: (view: CalendarViewMode) => void;
  onSearchChange: (value: string) => void;
  onTogglePlatform: (platform: SocialPlatform) => void;
  onToggleStatus: (status: ScheduledPostStatus) => void;
  onCampaignChange: (campaignId: string | null) => void;
  onToday: () => void;
};

const VIEWS: Array<{ id: CalendarViewMode; label: string }> = [
  { id: "month", label: "Month" },
  { id: "week", label: "Week" },
  { id: "day", label: "Day" },
];

export default function CalendarToolbar({
  view,
  search,
  platforms,
  statuses,
  campaignId,
  campaigns,
  onViewChange,
  onSearchChange,
  onTogglePlatform,
  onToggleStatus,
  onCampaignChange,
  onToday,
}: CalendarToolbarProps) {
  return (
    <section className="space-y-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 sm:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="inline-flex rounded-xl border border-white/10 bg-white/[0.03] p-1">
          {VIEWS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onViewChange(item.id)}
              className={`rounded-lg px-3 py-2 text-xs font-medium transition sm:text-sm ${
                view === item.id
                  ? "bg-gradient-to-r from-cyan-500/25 via-violet-500/25 to-fuchsia-500/25 text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center lg:max-w-xl">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="search"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search captions, notes…"
              className="w-full rounded-xl border border-white/10 bg-[#0a0618] py-2.5 pl-9 pr-3 text-sm text-white outline-none transition focus:border-cyan-400/40"
            />
          </div>
          <button
            type="button"
            onClick={onToday}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2.5 text-sm font-medium text-cyan-200 transition hover:bg-cyan-500/15"
          >
            <CalendarDays className="h-4 w-4" />
            Today
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
          <Filter className="h-3.5 w-3.5" />
          Filters
        </div>

        <div className="flex flex-wrap gap-2">
          {SOCIAL_PLATFORMS.map((platform) => {
            const active = platforms.includes(platform);
            return (
              <button
                key={platform}
                type="button"
                onClick={() => onTogglePlatform(platform)}
                className={`rounded-full border px-3 py-1 text-xs transition ${
                  active
                    ? "border-cyan-400/40 bg-cyan-500/15 text-cyan-100"
                    : "border-white/10 bg-white/[0.03] text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {PLATFORM_META[platform].label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-2">
          {SCHEDULED_POST_STATUSES.map((status) => {
            const active = statuses.includes(status);
            return (
              <button
                key={status}
                type="button"
                onClick={() => onToggleStatus(status)}
                className={`rounded-full border px-3 py-1 text-xs transition ${
                  active
                    ? "border-violet-400/40 bg-violet-500/15 text-violet-100"
                    : "border-white/10 bg-white/[0.03] text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {CALENDAR_STATUS_LABELS[status]}
              </button>
            );
          })}
        </div>

        <select
          value={campaignId ?? ""}
          onChange={(event) =>
            onCampaignChange(event.target.value ? event.target.value : null)
          }
          className="w-full max-w-sm rounded-xl border border-white/10 bg-[#0a0618] px-3 py-2.5 text-sm text-white outline-none transition focus:border-cyan-400/40"
        >
          <option value="">All campaigns</option>
          {campaigns.map((campaign) => (
            <option key={campaign.id} value={campaign.id}>
              {campaign.name}
              {campaign.visibility === "team" ? " · Team" : ""}
            </option>
          ))}
        </select>
      </div>
    </section>
  );
}
