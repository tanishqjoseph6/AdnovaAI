"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  CalendarDayDropZone,
  CalendarPostChip,
} from "@/components/campaign-calendar/CalendarPostChip";
import {
  addMonths,
  buildMonthCells,
  dayDropId,
  dayKey,
  groupPostsByDay,
} from "@/lib/campaign-calendar/utils";
import { formatSchedulerMonthYear, isSameLocalDay } from "@/lib/social-scheduler/format";
import type { Campaign, ScheduledPost } from "@/lib/social-scheduler/types";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type MonthCalendarProps = {
  month: Date;
  posts: ScheduledPost[];
  campaigns: Campaign[];
  onMonthChange: (month: Date) => void;
  onSelectPost: (post: ScheduledPost) => void;
  onCreateAt: (date: Date) => void;
};

export default function MonthCalendar({
  month,
  posts,
  campaigns,
  onMonthChange,
  onSelectPost,
  onCreateAt,
}: MonthCalendarProps) {
  const postsByDay = groupPostsByDay(posts);
  const cells = buildMonthCells(month);
  const today = new Date();

  return (
    <motion.section
      key={`month-${month.getFullYear()}-${month.getMonth()}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="glass rounded-2xl border border-white/[0.08] p-4 shadow-xl shadow-black/10 sm:p-6"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Month</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Drag posts between days to reschedule.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onMonthChange(addMonths(month, -1))}
            className="rounded-lg border border-white/10 bg-white/[0.04] p-2 text-zinc-300 transition hover:bg-white/[0.08]"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-36 text-center text-sm font-medium text-white">
            {formatSchedulerMonthYear(month)}
          </span>
          <button
            type="button"
            onClick={() => onMonthChange(addMonths(month, 1))}
            className="rounded-lg border border-white/10 bg-white/[0.04] p-2 text-zinc-300 transition hover:bg-white/[0.08]"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="py-1">
            {label}
          </div>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-2">
        <AnimatePresence initial={false}>
          {cells.map((cell) => {
            if (!cell.date) {
              return (
                <div
                  key={cell.key}
                  className="min-h-28 rounded-xl border border-transparent"
                />
              );
            }

            const dayPosts = postsByDay.get(cell.key) ?? [];
            const isToday = isSameLocalDay(cell.date, today);
            const dropId = dayDropId(cell.date);

            return (
              <CalendarDayDropZone
                key={cell.key}
                id={dropId}
                className={`min-h-28 rounded-xl border p-2 transition ${
                  isToday
                    ? "border-cyan-400/30 bg-cyan-500/[0.06]"
                    : "border-white/[0.06] bg-white/[0.02]"
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <p
                    className={`text-xs font-semibold ${
                      isToday ? "text-cyan-200" : "text-zinc-400"
                    }`}
                  >
                    {cell.date.getDate()}
                  </p>
                  <button
                    type="button"
                    onClick={() => onCreateAt(cell.date!)}
                    className="rounded px-1 text-[10px] text-zinc-500 transition hover:bg-white/10 hover:text-white"
                  >
                    +
                  </button>
                </div>
                <div className="mt-2 space-y-1">
                  {dayPosts.slice(0, 3).map((post) => (
                    <CalendarPostChip
                      key={post.id}
                      post={post}
                      campaigns={campaigns}
                      compact
                      onSelect={onSelectPost}
                    />
                  ))}
                  {dayPosts.length > 3 ? (
                    <p className="text-[10px] text-zinc-500">
                      +{dayPosts.length - 3} more
                    </p>
                  ) : null}
                </div>
              </CalendarDayDropZone>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}
