"use client";

import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  CalendarDayDropZone,
  CalendarPostChip,
} from "@/components/campaign-calendar/CalendarPostChip";
import {
  addWeeks,
  buildWeekDays,
  dayDropId,
  dayKey,
  groupPostsByDay,
} from "@/lib/campaign-calendar/utils";
import { formatSchedulerDateInput, isSameLocalDay } from "@/lib/social-scheduler/format";
import type { Campaign, ScheduledPost } from "@/lib/social-scheduler/types";

type WeekCalendarProps = {
  anchor: Date;
  posts: ScheduledPost[];
  campaigns: Campaign[];
  onAnchorChange: (date: Date) => void;
  onSelectPost: (post: ScheduledPost) => void;
  onCreateAt: (date: Date) => void;
};

export default function WeekCalendar({
  anchor,
  posts,
  campaigns,
  onAnchorChange,
  onSelectPost,
  onCreateAt,
}: WeekCalendarProps) {
  const days = buildWeekDays(anchor);
  const postsByDay = groupPostsByDay(posts);
  const today = new Date();
  const rangeLabel = `${formatSchedulerDateInput(days[0]!)} → ${formatSchedulerDateInput(days[6]!)}`;

  return (
    <motion.section
      key={`week-${dayKey(days[0]!)}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="glass rounded-2xl border border-white/[0.08] p-4 shadow-xl shadow-black/10 sm:p-6"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Week</h2>
          <p className="mt-1 text-sm text-zinc-500">{rangeLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onAnchorChange(addWeeks(anchor, -1))}
            className="rounded-lg border border-white/10 bg-white/[0.04] p-2 text-zinc-300 transition hover:bg-white/[0.08]"
            aria-label="Previous week"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onAnchorChange(addWeeks(anchor, 1))}
            className="rounded-lg border border-white/10 bg-white/[0.04] p-2 text-zinc-300 transition hover:bg-white/[0.08]"
            aria-label="Next week"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-7">
        {days.map((day) => {
          const key = dayKey(day);
          const dayPosts = postsByDay.get(key) ?? [];
          const isToday = isSameLocalDay(day, today);

          return (
            <CalendarDayDropZone
              key={key}
              id={dayDropId(day)}
              className={`min-h-56 rounded-xl border p-3 ${
                isToday
                  ? "border-cyan-400/30 bg-cyan-500/[0.06]"
                  : "border-white/[0.06] bg-white/[0.02]"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-zinc-500">
                    {day.toLocaleDateString("en-US", { weekday: "short" })}
                  </p>
                  <p
                    className={`text-sm font-semibold ${
                      isToday ? "text-cyan-200" : "text-white"
                    }`}
                  >
                    {day.getDate()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onCreateAt(day)}
                  className="rounded px-1.5 text-xs text-zinc-500 hover:bg-white/10 hover:text-white"
                >
                  +
                </button>
              </div>
              <div className="mt-3 space-y-2">
                {dayPosts.map((post) => (
                  <CalendarPostChip
                    key={post.id}
                    post={post}
                    campaigns={campaigns}
                    onSelect={onSelectPost}
                  />
                ))}
              </div>
            </CalendarDayDropZone>
          );
        })}
      </div>
    </motion.section>
  );
}
