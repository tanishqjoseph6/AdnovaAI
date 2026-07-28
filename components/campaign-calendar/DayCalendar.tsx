"use client";

import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  CalendarDayDropZone,
  CalendarPostChip,
} from "@/components/campaign-calendar/CalendarPostChip";
import { addDays, dayDropId, dayKey } from "@/lib/campaign-calendar/utils";
import {
  formatSchedulerDateInput,
  formatSchedulerMonthYear,
  isSameLocalDay,
} from "@/lib/social-scheduler/format";
import type { Campaign, ScheduledPost } from "@/lib/social-scheduler/types";

type DayCalendarProps = {
  day: Date;
  posts: ScheduledPost[];
  campaigns: Campaign[];
  onDayChange: (date: Date) => void;
  onSelectPost: (post: ScheduledPost) => void;
  onCreateAt: (date: Date) => void;
};

export default function DayCalendar({
  day,
  posts,
  campaigns,
  onDayChange,
  onSelectPost,
  onCreateAt,
}: DayCalendarProps) {
  const today = new Date();
  const isToday = isSameLocalDay(day, today);
  const dayPosts = posts
    .filter((post) => isSameLocalDay(new Date(post.scheduledFor), day))
    .sort(
      (a, b) =>
        new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime()
    );

  const hours = Array.from({ length: 24 }, (_, hour) => {
    const hourPosts = dayPosts.filter(
      (post) => new Date(post.scheduledFor).getHours() === hour
    );
    return { hour, hourPosts };
  });

  return (
    <motion.section
      key={`day-${dayKey(day)}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="glass rounded-2xl border border-white/[0.08] p-4 shadow-xl shadow-black/10 sm:p-6"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Day</h2>
          <p className="mt-1 text-sm text-zinc-500">
            {formatSchedulerMonthYear(day)} · {formatSchedulerDateInput(day)}
            {isToday ? " · Today" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onDayChange(addDays(day, -1))}
            className="rounded-lg border border-white/10 bg-white/[0.04] p-2 text-zinc-300 transition hover:bg-white/[0.08]"
            aria-label="Previous day"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onCreateAt(day)}
            className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs font-medium text-cyan-200"
          >
            Add post
          </button>
          <button
            type="button"
            onClick={() => onDayChange(addDays(day, 1))}
            className="rounded-lg border border-white/10 bg-white/[0.04] p-2 text-zinc-300 transition hover:bg-white/[0.08]"
            aria-label="Next day"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <CalendarDayDropZone
        id={dayDropId(day)}
        className="max-h-[70vh] space-y-2 overflow-y-auto pr-1"
      >
        {hours.map(({ hour, hourPosts }) => (
          <div
            key={hour}
            className="grid grid-cols-[64px_1fr] gap-3 rounded-xl border border-white/[0.05] bg-white/[0.015] p-2"
          >
            <p className="pt-1 text-xs font-medium text-zinc-500">
              {String(hour).padStart(2, "0")}:00
            </p>
            <div className="min-h-12 space-y-2">
              {hourPosts.map((post) => (
                <CalendarPostChip
                  key={post.id}
                  post={post}
                  campaigns={campaigns}
                  onSelect={onSelectPost}
                />
              ))}
            </div>
          </div>
        ))}
      </CalendarDayDropZone>
    </motion.section>
  );
}
